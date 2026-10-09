import { z } from 'zod';

/** Request contracts for the folder module. */

export const folderIdParam = z.object({ id: z.uuid('Invalid folder id') });

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(120),
  /** Omit or send null to create at the root. */
  parentId: z.uuid().nullable().optional(),
  description: z.string().trim().max(1000).default(''),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  /** Re-parent the folder. `null` moves it to the root. */
  parentId: z.uuid().nullable().optional(),
});

export const listFolderContentsQuerySchema = z.object({
  /**
   * `direct`  — only this folder's own children (default)
   * `all`     — every descendant, for breadcrumbs and recursive views
   */
  scope: z.enum(['direct', 'all']).default('direct'),
  includeArchived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export const deleteFolderQuerySchema = z.object({
  /**
   * When true, the folder's help items are moved to the root instead of being
   * blocked. Without it, deleting a non-empty folder returns 409.
   */
  moveItemsToRoot: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type ListFolderContentsQuery = z.infer<typeof listFolderContentsQuerySchema>;
export type DeleteFolderQuery = z.infer<typeof deleteFolderQuerySchema>;
