import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { helpFolders } from './help-folders.js';
import {
  archiveStatusEnum,
  contentTypeEnum,
  helpStatusEnum,
  reviewActionEnum,
} from './pg-enums.js';

/**
 * A help item (a "file" in the explorer) attached to a UI element.
 *
 * `context_key` is the stable identifier for the target element (e.g.
 * `sidebar.settings`), written by the page as `data-hms-context`. That is what
 * lets a right-click resolve "which element am I on?" and fetch its help.
 */
export const helpItems = pgTable(
  'help_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: text('tenant_id').notNull().default('default'),
    /**
     * Owning folder. `onDelete: 'set null'` means deleting a folder never
     * destroys the help content inside it — orphans surface at the root.
     */
    folderId: uuid('folder_id').references(() => helpFolders.id, { onDelete: 'set null' }),

    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    contentType: contentTypeEnum('content_type').notNull(),
    /** URL for media, or the body itself when contentType is `text`. */
    contentUrl: text('content_url'),

    /** The element this documents. NULL means page-level/global help. */
    contextKey: text('context_key'),
    /** Human-readable path, e.g. "Dashboard > Reports > Export". */
    relatedContext: text('related_context').notNull().default(''),

    status: helpStatusEnum('status').notNull().default('pending'),
    archiveStatus: archiveStatusEnum('archive_status').notNull().default('active'),

    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectedBy: uuid('rejected_by').references(() => users.id, { onDelete: 'set null' }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),

    /**
     * Bumped on every content edit.
     *
     * `approved_content_version` records which version was reviewed, so an
     * approval can never be applied to content the reviewer never saw.
     */
    contentVersion: integer('content_version').notNull().default(1),
    approvedContentVersion: integer('approved_content_version'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('help_items_tenant_status_idx').on(t.tenantId, t.status),
    index('help_items_context_idx').on(t.contextKey),
    index('help_items_author_idx').on(t.authorId),
    index('help_items_folder_idx').on(t.folderId),
    // Speeds the customer-facing "approved help for this element" lookup.
    index('help_items_lookup_idx')
      .on(t.tenantId, t.contextKey, t.status)
      .where(sql`${t.archiveStatus} = 'active'`),
  ],
);

/**
 * Append-only audit trail of every state change.
 *
 * Written in the same transaction as the item mutation, so history can never
 * drift from current state.
 */
export const helpItemEvents = pgTable(
  'help_item_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    helpItemId: uuid('help_item_id')
      .notNull()
      .references(() => helpItems.id, { onDelete: 'cascade' }),
    action: reviewActionEnum('action').notNull(),
    fromStatus: helpStatusEnum('from_status'),
    toStatus: helpStatusEnum('to_status'),
    reason: text('reason'),
    /** RESTRICT: the audit trail must outlive the accounts that created it. */
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    tenantId: text('tenant_id').notNull().default('default'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('help_events_item_idx').on(t.helpItemId), index('help_events_tenant_idx').on(t.tenantId)],
);

/**
 * Media files uploaded for folders or help items. Metadata only; the bytes live
 * in object storage.
 *
 * An asset has AT MOST ONE owner: a folder or a help item, never both. Both
 * being null is valid and means the asset lives in the `root` pseudo-folder —
 * that is why the constraint added in migration 0001 is `num_nonnulls(...) <= 1`
 * rather than `= 1`.
 *
 * The constraint lives in SQL rather than TypeScript so a bad write from any
 * other client is rejected too.
 *
 * Both references cascade: deleting a help item removes its attachments, and
 * deleting a folder removes everything filed directly in it.
 */
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    helpItemId: uuid('help_item_id').references(() => helpItems.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => helpFolders.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    /** Object-storage key — never an absolute filesystem path. */
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    tenantId: text('tenant_id').notNull().default('default'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('media_item_idx').on(t.helpItemId),
    index('media_folder_idx').on(t.folderId),
    index('media_tenant_idx').on(t.tenantId),
  ],
);

export type HelpItemRow = typeof helpItems.$inferSelect;
export type NewHelpItemRow = typeof helpItems.$inferInsert;
export type HelpItemEventRow = typeof helpItemEvents.$inferSelect;
export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRow = typeof mediaAssets.$inferInsert;
