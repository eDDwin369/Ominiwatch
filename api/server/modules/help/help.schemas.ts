import { z } from 'zod';
import { CONTENT_TYPES, HELP_STATUSES } from '../../db/schema/enums.js';

/** Request contracts for the help module. */

const idParam = z.object({ id: z.uuid('Invalid id') });

export const createHelpItemSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).default(''),
  contentType: z.enum(CONTENT_TYPES),
  contentUrl: z.url().max(2000).optional(),
  contextKey: z.string().trim().max(200).optional(),
  relatedContext: z.string().trim().max(300).default(''),
  /** Owning folder. Omit or send null to place the item at the root. */
  folderId: z.uuid().nullable().optional(),
  /**
   * Content body for `text` items. Required when contentType is `text`,
   * otherwise ignored — enforced by the refine below.
   */
  body: z.string().max(20000).optional(),
}).refine(
  (v) => v.contentType !== 'text' || Boolean(v.body?.trim()),
  { message: 'body is required when contentType is "text"', path: ['body'] },
).refine(
  (v) => v.contentType === 'text' || Boolean(v.contentUrl),
  { message: 'contentUrl is required for non-text content', path: ['contentUrl'] },
);

export const updateHelpItemSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  contentUrl: z.url().max(2000).optional(),
  relatedContext: z.string().trim().max(300).optional(),
  /** Re-file the item. Send null to move it to the root. */
  folderId: z.uuid().nullable().optional(),
  body: z.string().max(20000).optional(),
});

export const reviewHelpItemSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  /** Mandatory on rejection so the manager knows what to fix. */
  reason: z.string().trim().max(1000).optional(),
}).refine((v) => v.decision !== 'rejected' || Boolean(v.reason), {
  message: 'reason is required when rejecting',
  path: ['reason'],
});

export const listHelpItemsQuerySchema = z.object({
  status: z.enum(HELP_STATUSES).optional(),
  contextKey: z.string().trim().max(200).optional(),
  /** Filter by folder. Use `root` for items with no folder. */
  folderId: z.union([z.uuid(), z.literal('root')]).optional(),
  authorId: z.uuid().optional(),
  /** Only non-archived items by default. */
  includeArchived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateHelpItemInput = z.input<typeof createHelpItemSchema>;
export type UpdateHelpItemInput = z.infer<typeof updateHelpItemSchema>;
export type ReviewHelpItemInput = z.infer<typeof reviewHelpItemSchema>;
export type ListHelpItemsQuery = z.infer<typeof listHelpItemsQuerySchema>;

export { idParam };
