import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * A folder in the help content tree.
 *
 * Folders nest arbitrarily via `parent_id` (self-reference); NULL means the
 * folder sits at the root. `UNIQUE (tenant_id, parent_id, name)` stops two
 * siblings sharing a name. PostgreSQL treats NULLs as distinct in unique
 * indexes, so root-level duplicates are additionally guarded in the service.
 */
export const helpFolders = pgTable(
  'help_folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: text('tenant_id').notNull().default('default'),

    name: text('name').notNull(),
    /** NULL = root level. Self-reference cascades on delete. */
    parentId: uuid('parent_id'),

    description: text('description').notNull().default(''),

    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('help_folders_tenant_idx').on(t.tenantId),
    index('help_folders_parent_idx').on(t.parentId),
    uniqueIndex('help_folders_sibling_name_unq').on(
      t.tenantId,
      sql`coalesce(${t.parentId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
      sql`lower(${t.name})`,
    ),
  ],
);

export type HelpFolderRow = typeof helpFolders.$inferSelect;
export type NewHelpFolderRow = typeof helpFolders.$inferInsert;
