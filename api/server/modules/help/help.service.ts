/**
 * Help item business logic — the heart of the approval workflow.
 *
 * The rules, in one place:
 *   - customers can only ever READ approved, active items
 *   - managers author, edit and submit; their items start `pending`
 *   - superadmins approve/reject anything, and may publish immediately
 *   - editing already-approved content automatically reverts it to `pending`,
 *     so unreviewed changes can never stay live
 *   - every transition appends to the audit trail in the same transaction
 */
import { and, asc, count, desc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '../../db/client.js';
import { newId } from '../../lib/ids.js';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import type { TokenPayload } from '../../lib/jwt.js';
import type { HelpStatus } from '../../db/schema/enums.js';
import { AUTHOR_ROLES as AUTHOR_ROLE_LIST } from '../../db/schema/enums.js';

type Role = (typeof AUTHOR_ROLE_LIST)[number];
import type {
  CreateHelpItemInput,
  ListHelpItemsQuery,
  ReviewHelpItemInput,
  UpdateHelpItemInput,
} from './help.schemas.js';

/** Roles allowed to author or manage help content. */
/** Roles allowed to author or manage help content. */
const AUTHOR_ROLES: readonly Role[] = AUTHOR_ROLE_LIST;

export interface HelpItemView {
  id: string;
  title: string;
  description: string;
  contentType: string;
  contentUrl: string | null;
  contextKey: string | null;
  relatedContext: string;
  /** Owning folder, or null when the item sits at the root. */
  folderId: string | null;
  status: HelpStatus;
  archiveStatus: string;
  authorId: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  contentVersion: number;
  approvedContentVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Strips internal-only fields (authorId etc. stay, but audit noise is trimmed). */
const toView = (row: typeof schema.helpItems.$inferSelect): HelpItemView => ({
  id: row.id,
  title: row.title,
  description: row.description,
  contentType: row.contentType,
  contentUrl: row.contentUrl,
  contextKey: row.contextKey,
  relatedContext: row.relatedContext,
  folderId: row.folderId,
  status: row.status,
  archiveStatus: row.archiveStatus,
  authorId: row.authorId,
  approvedBy: row.approvedBy,
  approvedAt: row.approvedAt,
  rejectedBy: row.rejectedBy,
  rejectedAt: row.rejectedAt,
  rejectionReason: row.rejectionReason,
  contentVersion: row.contentVersion,
  approvedContentVersion: row.approvedContentVersion,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * Loads an item, enforcing tenant isolation.
 *
 * Every read path goes through here so a wrong `tenantId` can never surface
 * another tenant's content, regardless of role.
 */
async function loadScoped(itemId: string, auth: TokenPayload): Promise<typeof schema.helpItems.$inferSelect> {
  const row = await db.query.helpItems.findFirst({
    where: and(eq(schema.helpItems.id, itemId), eq(schema.helpItems.tenantId, auth.tenantId)),
  });
  if (!row) throw notFound('Help item not found');
  return row;
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * Lists help items with role-aware visibility:
 *   - customers: approved + active only
 *   - managers:  their own tenant's items, any status
 *   - superadmin: everything in the tenant
 */
export async function list(query: ListHelpItemsQuery, auth: TokenPayload) {
  const conditions = [eq(schema.helpItems.tenantId, auth.tenantId)];

  // The core rule: a customer never sees unpublished work.
  if (auth.role === 'customer') {
    conditions.push(eq(schema.helpItems.status, 'approved'));
  } else if (query.status) {
    conditions.push(eq(schema.helpItems.status, query.status));
  }

  if (!query.includeArchived) {
    conditions.push(eq(schema.helpItems.archiveStatus, 'active'));
  }
  if (query.contextKey) conditions.push(eq(schema.helpItems.contextKey, query.contextKey));
  if (query.folderId === 'root') {
    conditions.push(isNull(schema.helpItems.folderId));
  } else if (query.folderId) {
    conditions.push(eq(schema.helpItems.folderId, query.folderId));
  }
  if (query.authorId && auth.role !== 'customer') {
    conditions.push(eq(schema.helpItems.authorId, query.authorId));
  }

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(schema.helpItems)
      .where(where)
      .orderBy(desc(schema.helpItems.updatedAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ total: count() }).from(schema.helpItems).where(where),
  ]);

  return {
    items: rows.map(toView),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

/** Single item. Customers are refused unless the item is approved and active. */
export async function getById(itemId: string, auth: TokenPayload): Promise<HelpItemView> {
  const row = await loadScoped(itemId, auth);

  if (auth.role === 'customer' && (row.status !== 'approved' || row.archiveStatus !== 'active')) {
    // 404 rather than 403: customers should not learn that unpublished
    // content exists at all.
    throw notFound('Help item not found');
  }

  return toView(row);
}

/** Full audit trail for one item. Author roles only. */
export async function getHistory(itemId: string, auth: TokenPayload) {
  if (!(AUTHOR_ROLES as readonly string[]).includes(auth.role)) throw forbidden('Only authors can view history');
  await loadScoped(itemId, auth);

  const events = await db
    .select()
    .from(schema.helpItemEvents)
    .where(eq(schema.helpItemEvents.helpItemId, itemId))
    .orderBy(asc(schema.helpItemEvents.createdAt));

  return { events };
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/**
 * Creates an item.
 *
 * A manager's item is born `pending`. A superadmin's item is published
 * immediately (`approved`), which is why this is the one write path where the
 * author role changes the outcome.
 */
export async function create(input: CreateHelpItemInput, auth: TokenPayload): Promise<HelpItemView> {
  if (!(AUTHOR_ROLES as readonly string[]).includes(auth.role)) throw forbidden('Only managers can create help items');

  const isSuperadmin = auth.role === 'superadmin';
  const now = new Date();
  const id = newId();

  // Reject a folder from another tenant rather than silently orphaning the item.
  if (input.folderId) {
    const folder = await db.query.helpFolders.findFirst({
      where: and(
        eq(schema.helpFolders.id, input.folderId),
        eq(schema.helpFolders.tenantId, auth.tenantId),
      ),
      columns: { id: true },
    });
    if (!folder) throw notFound('Folder not found');
  }

  const contentUrl = input.contentType === 'text' ? null : (input.contentUrl ?? null);

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.helpItems)
      .values({
        id,
        tenantId: auth.tenantId,
        folderId: input.folderId ?? null,
        title: input.title,
        description: input.description,
        contentType: input.contentType,
        contentUrl,
        contextKey: input.contextKey ?? null,
        relatedContext: input.relatedContext,
        status: isSuperadmin ? 'approved' : 'pending',
        authorId: auth.sub,
        approvedBy: isSuperadmin ? auth.sub : null,
        approvedAt: isSuperadmin ? now : null,
        contentVersion: 1,
        approvedContentVersion: isSuperadmin ? 1 : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // `text` items store their body as the content column so one column serves both.
    if (input.contentType === 'text' && input.body) {
      await tx
        .update(schema.helpItems)
        .set({ contentUrl: input.body })
        .where(eq(schema.helpItems.id, id));
    }

    await tx.insert(schema.helpItemEvents).values({
      id: newId(),
      helpItemId: id,
      action: isSuperadmin ? 'created' : 'submitted',
      fromStatus: null,
      toStatus: isSuperadmin ? 'approved' : 'pending',
      reason: null,
      actorId: auth.sub,
      tenantId: auth.tenantId,
    });
  });

  // Re-read so the text-body write above is included.
  return toView((await db.query.helpItems.findFirst({ where: eq(schema.helpItems.id, id) }))!);
}

/**
 * Edits an item.
 *
 * Critical rule: if the item was already approved, an edit bumps
 * `contentVersion` and resets status to `pending`. Previously-approved content
 * is un-published until re-approved, so customers never see unreviewed
 * changes. A superadmin editing approved content stays approved.
 */
export async function update(itemId: string, input: UpdateHelpItemInput, auth: TokenPayload) {
  const row = await loadScoped(itemId, auth);

  const isAuthor = row.authorId === auth.sub;
  const isSuperadmin = auth.role === 'superadmin';
  if (!isSuperadmin && !isAuthor) throw forbidden('You can only edit help items you authored');

  const now = new Date();
  const contentChanged =
    input.title !== undefined ||
    input.description !== undefined ||
    input.contentUrl !== undefined ||
    input.body !== undefined;

  const nextVersion = contentChanged ? row.contentVersion + 1 : row.contentVersion;

  // Un-publish on edit, unless a superadmin is making the change.
  const revertsToPending = row.status === 'approved' && contentChanged && !isSuperadmin;
  const nextStatus: HelpStatus = revertsToPending ? 'pending' : row.status;

  await db.transaction(async (tx) => {
    await tx
      .update(schema.helpItems)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.contentUrl !== undefined ? { contentUrl: input.contentUrl } : {}),
        ...(input.body !== undefined && row.contentType === 'text'
          ? { contentUrl: input.body }
          : {}),
        ...(input.relatedContext !== undefined ? { relatedContext: input.relatedContext } : {}),
        ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
        contentVersion: nextVersion,
        ...(revertsToPending
          ? { status: nextStatus, approvedBy: null, approvedAt: null, approvedContentVersion: null }
          : {}),
        updatedAt: now,
      })
      .where(eq(schema.helpItems.id, itemId));

    await tx.insert(schema.helpItemEvents).values({
      id: newId(),
      helpItemId: itemId,
      action: revertsToPending ? 'submitted' : 'created',
      fromStatus: row.status,
      toStatus: nextStatus,
      reason: revertsToPending ? 'Content changed; awaiting re-approval' : null,
      actorId: auth.sub,
      tenantId: auth.tenantId,
    });
  });

  return getById(itemId, auth);
}

/**
 * Approve or reject. Superadmin only.
 *
 * `approvedContentVersion` records which version was reviewed. If the manager
 * edits afterwards, `contentVersion` moves ahead of it and `update()`
 * reverts the item to `pending` — so an approval can never be stale.
 */
export async function review(itemId: string, input: ReviewHelpItemInput, auth: TokenPayload) {
  if (auth.role !== 'superadmin') throw forbidden('Only a superadmin can review help items');

  const row = await loadScoped(itemId, auth);
  if (row.archiveStatus === 'archived') throw badRequest('Cannot review an archived item');

  const now = new Date();
  const approved = input.decision === 'approved';

  await db.transaction(async (tx) => {
    await tx
      .update(schema.helpItems)
      .set({
        status: input.decision,
        ...(approved
          ? {
              approvedBy: auth.sub,
              approvedAt: now,
              approvedContentVersion: row.contentVersion,
              rejectedBy: null,
              rejectedAt: null,
              rejectionReason: null,
            }
          : {
              rejectedBy: auth.sub,
              rejectedAt: now,
              rejectionReason: input.reason!,
              approvedBy: null,
              approvedAt: null,
              approvedContentVersion: null,
            }),
        updatedAt: now,
      })
      .where(eq(schema.helpItems.id, itemId));

    await tx.insert(schema.helpItemEvents).values({
      id: newId(),
      helpItemId: itemId,
      action: approved ? 'approved' : 'rejected',
      fromStatus: row.status,
      toStatus: input.decision,
      reason: input.reason ?? null,
      actorId: auth.sub,
      tenantId: auth.tenantId,
    });
  });

  return getById(itemId, auth);
}

/** Soft delete: flips `archiveStatus`, keeping history intact. */
export async function setArchived(itemId: string, archived: boolean, auth: TokenPayload) {
  const row = await loadScoped(itemId, auth);

  const isSuperadmin = auth.role === 'superadmin';
  if (!isSuperadmin && row.authorId !== auth.sub) {
    throw forbidden('You can only archive help items you authored');
  }
  // Archiving published content is a moderation action.
  if (archived && row.status === 'approved' && !isSuperadmin) {
    throw forbidden('Only a superadmin can archive approved help items');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.helpItems)
      .set({ archiveStatus: archived ? 'archived' : 'active', updatedAt: new Date() })
      .where(eq(schema.helpItems.id, itemId));

    await tx.insert(schema.helpItemEvents).values({
      id: newId(),
      helpItemId: itemId,
      action: archived ? 'archived' : 'restored',
      fromStatus: row.status,
      toStatus: row.status,
      reason: null,
      actorId: auth.sub,
      tenantId: auth.tenantId,
    });
  });

  return getById(itemId, auth);
}

/** Re-submits a rejected item for another review pass. */
export async function resubmit(itemId: string, auth: TokenPayload) {
  const row = await loadScoped(itemId, auth);

  if (auth.role !== 'superadmin' && row.authorId !== auth.sub) {
    throw forbidden('You can only resubmit help items you authored');
  }
  if (row.status !== 'rejected') throw badRequest('Only rejected items can be resubmitted');

  await db.transaction(async (tx) => {
    await tx
      .update(schema.helpItems)
      .set({
        status: 'pending',
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.helpItems.id, itemId));

    await tx.insert(schema.helpItemEvents).values({
      id: newId(),
      helpItemId: itemId,
      action: 'resubmitted',
      fromStatus: 'rejected',
      toStatus: 'pending',
      reason: null,
      actorId: auth.sub,
      tenantId: auth.tenantId,
    });
  });

  return getById(itemId, auth);
}

/** Counters for the superadmin dashboard. */
export async function stats(auth: TokenPayload) {
  const tenant = eq(schema.helpItems.tenantId, auth.tenantId);
  const rows = await db
    .select({
      status: schema.helpItems.status,
      total: count(),
    })
    .from(schema.helpItems)
    .where(and(tenant, eq(schema.helpItems.archiveStatus, 'active')))
    .groupBy(schema.helpItems.status);

  const byStatus: Record<HelpStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) byStatus[r.status] = r.total;

  return { byStatus, awaitingReview: byStatus.pending };
}
