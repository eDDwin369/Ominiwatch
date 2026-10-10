/**
 * Folder tree business logic.
 *
 * Folders nest via `parentId` and are only writable by manager/superadmin.
 * Three invariants are enforced here rather than trusted from the caller:
 *
 *   1. no cycles — a folder can never become its own ancestor
 *   2. no duplicate sibling names at the same level
 *   3. deleting a non-empty folder requires an explicit opt-in, so help
 *      content is never destroyed as a side effect
 *
 * The whole tree for a tenant is loaded in one query and assembled in memory.
 * Folder counts are small (hundreds), so this avoids recursive queries while
 * keeping the code easy to follow.
 */
import { and, asc, count, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { db, schema } from '../../db/client.js';
import { newId } from '../../lib/ids.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import type { TokenPayload } from '../../lib/jwt.js';
import type { Role } from '../../db/schema/enums.js';
import type {
  CreateFolderInput,
  DeleteFolderQuery,
  ListFolderContentsQuery,
  UpdateFolderInput,
} from './folders.schemas.js';

const FOLDER_ROLES: Role[] = ['manager', 'superadmin'];

export interface FolderView {
  id: string;
  name: string;
  parentId: string | null;
  description: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderNode extends FolderView {
  /** Child folders, nested. */
  children: FolderNode[];
  /** Help items directly inside this folder, before customer filtering. */
  itemCount: number;
}

/** A help item as shown in a folder listing. */
export interface FolderItemView {
  id: string;
  title: string;
  contentType: string;
  status: string;
  contextKey: string | null;
}

const assertCanWrite = (auth: TokenPayload): void => {
  if (!FOLDER_ROLES.includes(auth.role)) throw forbidden('Only managers can manage folders');
};

/** Every folder in the tenant, ordered for stable tree assembly. */
async function loadAll(auth: TokenPayload): Promise<typeof schema.helpFolders.$inferSelect[]> {
  return db
    .select()
    .from(schema.helpFolders)
    .where(eq(schema.helpFolders.tenantId, auth.tenantId))
    .orderBy(asc(schema.helpFolders.name));
}

const toView = (row: typeof schema.helpFolders.$inferSelect): FolderView => ({
  id: row.id,
  name: row.name,
  parentId: row.parentId,
  description: row.description,
  createdBy: row.createdBy,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * Returns every folder id beneath `folderId`, at any depth.
 *
 * A move is only safe if the new parent is NOT in this set (that would make
 * the folder its own ancestor). This walks *down* the child edges — walking up
 * the parent edges, as an earlier version did, cannot detect this case.
 */
async function descendantIdsOf(folderId: string, auth: TokenPayload): Promise<Set<string>> {
  const rows = await loadAll(auth);
  const childrenOf = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row.id);
    childrenOf.set(row.parentId, list);
  }

  const descendants = new Set<string>();
  const queue = [folderId];
  let guard = 0;

  while (queue.length && guard < 10_000) {
    const current = queue.shift()!;
    for (const child of childrenOf.get(current) ?? []) {
      if (descendants.has(child)) continue;
      descendants.add(child);
      queue.push(child);
      guard += 1;
    }
  }

  return descendants;
}

async function loadScoped(folderId: string, auth: TokenPayload) {
  const row = await db.query.helpFolders.findFirst({
    where: and(eq(schema.helpFolders.id, folderId), eq(schema.helpFolders.tenantId, auth.tenantId)),
  });
  if (!row) throw notFound('Folder not found');
  return row;
}

/**
 * Rejects a name that already exists among the target folder's siblings.
 * SQLite's unique index treats NULL parents as distinct, so root-level
 * duplicates must be caught explicitly here.
 */
async function assertSiblingNameFree(
  tenantId: string,
  parentId: string | null,
  name: string,
  excludeId?: string,
): Promise<void> {
  const base =
    parentId === null
      ? and(eq(schema.helpFolders.tenantId, tenantId), isNull(schema.helpFolders.parentId))
      : and(eq(schema.helpFolders.tenantId, tenantId), eq(schema.helpFolders.parentId, parentId));

  // The name comparison is the point of this check — without it any existing
  // sibling would be treated as a clash.
  const scope = and(base, eq(sql`lower(${schema.helpFolders.name})`, name.toLowerCase()));

  const clash = await db.query.helpFolders.findFirst({
    where: excludeId ? and(scope, ne(schema.helpFolders.id, excludeId)) : scope,
    columns: { id: true },
  });

  if (clash) {
    throw conflict(`A folder named "${name}" already exists in this location`);
  }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/** True when `node` sits somewhere beneath `candidate`, following parent links. */
function isDescendantOf(
  node: { parentId: string | null },
  candidate: { id: string },
  nodes: Map<string, FolderNode>,
): boolean {
  let cursor = node.parentId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    if (cursor === candidate.id) return true;
    seen.add(cursor);
    cursor = nodes.get(cursor)?.parentId ?? null;
  }
  return false;
}

/**
 * Builds the nested folder tree.
 *
 * Every folder is returned to managers/superadmins. Customers get the same
 * structure, but only folders that still contain at least one approved item
 * are kept — an empty folder is noise to them.
 */
export async function tree(auth: TokenPayload): Promise<FolderNode[]> {
  const rows = await loadAll(auth);

  // Published item counts per folder, used to prune empty branches.
  const publishedByFolder = new Map<string, number>();
  if (auth.role === 'customer') {
    const counts = await db
      .select({
        folderId: schema.helpItems.folderId,
        total: count(),
      })
      .from(schema.helpItems)
      .where(
        and(
          eq(schema.helpItems.tenantId, auth.tenantId),
          eq(schema.helpItems.status, 'approved'),
          eq(schema.helpItems.archiveStatus, 'active'),
          sql`${schema.helpItems.folderId} is not null`,
        ),
      )
      .groupBy(schema.helpItems.folderId);
    for (const c of counts) {
      if (c.folderId) publishedByFolder.set(c.folderId, Number(c.total));
    }
  } else {
    const counts = await db
      .select({ folderId: schema.helpItems.folderId, total: count() })
      .from(schema.helpItems)
      .where(
        and(
          eq(schema.helpItems.tenantId, auth.tenantId),
          eq(schema.helpItems.archiveStatus, 'active'),
          sql`${schema.helpItems.folderId} is not null`,
        ),
      )
      .groupBy(schema.helpItems.folderId);
    for (const c of counts) {
      if (c.folderId) publishedByFolder.set(c.folderId, Number(c.total));
    }
  }

  const nodes = new Map<string, FolderNode>(
    rows.map((r) => [
      r.id,
      { ...toView(r), children: [], itemCount: publishedByFolder.get(r.id) ?? 0 },
    ]),
  );

  const roots: FolderNode[] = [];
  for (const node of nodes.values()) {
    // `attaching` prevents a cyclic parent chain (only possible in corrupted
    // data, since moves are validated) from growing the tree without bound.
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && !isDescendantOf(node, parent, nodes)) parent.children.push(node);
    else roots.push(node);
  }

  // A branch with no published items anywhere is hidden from customers.
  if (auth.role !== 'customer') return roots;

  const hasPublished = (node: FolderNode): boolean => {
    node.children.forEach(hasPublished);
    node.itemCount += node.children.reduce((sum, c) => sum + c.itemCount, 0);
    return node.itemCount > 0;
  };

  return roots.filter(hasPublished);
}

/** Breadcrumb path from the root down to (and including) this folder. */
export async function breadcrumb(folderId: string, auth: TokenPayload) {
  const rows = await loadAll(auth);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const path: FolderView[] = [];
  const visited = new Set<string>();
  let cursor = byId.get(folderId) ?? null;

  // `visited` guards against a pre-existing cycle in the data: without it a
  // corrupted parent chain would loop forever.
  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    path.unshift(toView(cursor));
    cursor = cursor.parentId ? (byId.get(cursor.parentId) ?? null) : null;
  }

  if (path.length === 0) throw notFound('Folder not found');
  return { path };
}

/**
 * Lists the contents of a folder: child folders plus help items.
 * `scope=all` returns every descendant, for flattened views.
 */
export async function contents(folderId: string, query: ListFolderContentsQuery, auth: TokenPayload) {
  const folder = await loadScoped(folderId, auth);

  const all = await loadAll(auth);
  const byParent = new Map<string | null, typeof schema.helpFolders.$inferSelect[]>();
  for (const row of all) {
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }

  // Breadth-first walk to collect this folder plus every descendant.
  const folderIds = new Set<string>([folderId]);
  const queue = [folderId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const child of byParent.get(current) ?? []) {
      if (!folderIds.has(child.id)) {
        folderIds.add(child.id);
        queue.push(child.id);
      }
    }
  }

  const itemConditions = [
    eq(schema.helpItems.tenantId, auth.tenantId),
    eq(schema.helpItems.archiveStatus, 'active'),
    ...(query.scope === 'all'
      ? [inArray(schema.helpItems.folderId, [...folderIds])]
      : [eq(schema.helpItems.folderId, folderId)]),
  ];
  if (auth.role === 'customer') itemConditions.push(eq(schema.helpItems.status, 'approved'));

  const items = await db
    .select({
      id: schema.helpItems.id,
      title: schema.helpItems.title,
      contentType: schema.helpItems.contentType,
      status: schema.helpItems.status,
      contextKey: schema.helpItems.contextKey,
      folderId: schema.helpItems.folderId,
    })
    .from(schema.helpItems)
    .where(and(...itemConditions))
    .orderBy(asc(schema.helpItems.title));

  const childFolders = (query.scope === 'all' ? [...folderIds].filter((id) => id !== folderId) : [
    ...(byParent.get(folderId) ?? []).map((r) => r.id),
  ]).map((id) => toView(all.find((r) => r.id === id)!));

  return {
    folder: toView(folder),
    folders: childFolders,
    items: items.map(({ folderId: _ignored, ...item }): FolderItemView => item),
  };
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function create(input: CreateFolderInput, auth: TokenPayload): Promise<FolderView> {
  assertCanWrite(auth);

  const parentId = input.parentId ?? null;
  if (parentId) await loadScoped(parentId, auth); // validates same tenant

  await assertSiblingNameFree(auth.tenantId, parentId, input.name);

  const [row] = await db
    .insert(schema.helpFolders)
    .values({
      id: newId(),
      tenantId: auth.tenantId,
      name: input.name,
      parentId,
      description: input.description,
      createdBy: auth.sub,
    })
    .returning();

  return toView(row);
}

export async function update(folderId: string, input: UpdateFolderInput, auth: TokenPayload) {
  assertCanWrite(auth);
  const row = await loadScoped(folderId, auth);

  const nextParentId = input.parentId !== undefined ? input.parentId : row.parentId;
  const nextName = input.name ?? row.name;

  // Cycle guard: a folder cannot be moved into itself or one of its descendants.
  if (input.parentId !== undefined && input.parentId !== row.parentId) {
    if (input.parentId === folderId) {
      throw badRequest('A folder cannot be its own parent');
    }
    if (input.parentId) {
      await loadScoped(input.parentId, auth); // validates same tenant
      const descendants = await descendantIdsOf(folderId, auth);
      if (descendants.has(input.parentId)) {
        throw badRequest('Cannot move a folder into one of its own descendants');
      }
    }
  }

  // Only check for a clash when the name or the level actually changed.
  if (nextName !== row.name || nextParentId !== row.parentId) {
    await assertSiblingNameFree(auth.tenantId, nextParentId, nextName, folderId);
  }

  const [updated] = await db
    .update(schema.helpFolders)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.parentId !== undefined ? { parentId: nextParentId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.helpFolders.id, folderId))
    .returning();

  return toView(updated);
}

/**
 * Deletes a folder.
 *
 * Child folders cascade away (they have no meaning without their parent). Help
 * items are never destroyed: unless `moveItemsToRoot` is set, a folder that
 * still holds items returns 409 so the caller must decide what happens to
 * them first.
 */
export async function remove(folderId: string, query: DeleteFolderQuery, auth: TokenPayload) {
  assertCanWrite(auth);
  await loadScoped(folderId, auth);

  const [row] = await db
    .select({ total: count() })
    .from(schema.helpItems)
    .where(
      and(
        eq(schema.helpItems.folderId, folderId),
        eq(schema.helpItems.tenantId, auth.tenantId),
        eq(schema.helpItems.archiveStatus, 'active'),
      ),
    );

  const itemCount = Number(row?.total ?? 0);

  if (itemCount > 0 && !query.moveItemsToRoot) {
    throw conflict(
      `Folder still contains ${itemCount} item(s). Re-send with moveItemsToRoot=true to move them to the root.`,
    );
  }

  // Child folders are removed with their parent (FK cascade).
  await db.delete(schema.helpFolders).where(eq(schema.helpFolders.id, folderId));

  return { deleted: true, movedItemsToRoot: itemCount > 0 };
}
