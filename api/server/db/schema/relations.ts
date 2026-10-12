/**
 * Drizzle relations.
 *
 * Kept in its own module so the table files only depend on each other for
 * foreign keys, and all `db.query.*` graph traversal is defined in one place.
 */
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { helpFolders } from './help-folders.js';
import { helpItems, helpItemEvents, mediaAssets } from './help-items.js';

export const usersRelations = relations(users, ({ many }) => ({
  authoredHelpItems: many(helpItems, { relationName: 'help_author' }),
  approvedHelpItems: many(helpItems, { relationName: 'help_approver' }),
  events: many(helpItemEvents),
  folders: many(helpFolders),
}));

export const helpFoldersRelations = relations(helpFolders, ({ one, many }) => ({
  parent: one(helpFolders, {
    fields: [helpFolders.parentId],
    references: [helpFolders.id],
    relationName: 'folder_tree',
  }),
  children: many(helpFolders, { relationName: 'folder_tree' }),
  items: many(helpItems),
  creator: one(users, { fields: [helpFolders.createdBy], references: [users.id] }),
}));

export const helpItemsRelations = relations(helpItems, ({ one, many }) => ({
  folder: one(helpFolders, { fields: [helpItems.folderId], references: [helpFolders.id] }),
  author: one(users, {
    fields: [helpItems.authorId],
    references: [users.id],
    relationName: 'help_author',
  }),
  approver: one(users, {
    fields: [helpItems.approvedBy],
    references: [users.id],
    relationName: 'help_approver',
  }),
  events: many(helpItemEvents),
  assets: many(mediaAssets),
}));

export const helpItemEventsRelations = relations(helpItemEvents, ({ one }) => ({
  item: one(helpItems, { fields: [helpItemEvents.helpItemId], references: [helpItems.id] }),
  actor: one(users, { fields: [helpItemEvents.actorId], references: [users.id] }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  item: one(helpItems, { fields: [mediaAssets.helpItemId], references: [helpItems.id] }),
}));
