/**
 * Request contracts for the media module.
 *
 * Upload is a two-step flow, so there are two request bodies: one to request a
 * presigned URL, one to confirm the upload landed.
 */
import { z } from 'zod';

/**
 * Allowed upload types.
 *
 * This is the single source of truth for what may be uploaded: it drives both
 * the presign validation and the documented enum, so the API cannot accept a
 * type it will later refuse.
 */
export const UPLOADABLE_TYPES = ['image', 'pdf', 'video', 'text'] as const;

/** 25 MB. Chosen to stay inside a single S3 PUT without a multipart upload. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * A folder id, or the literal `root` for assets that belong to no folder.
 *
 * Mirrors the convention already used by the help list query, so the two read
 * consistently from a client's point of view.
 */
export const uploadTargetSchema = z.object({
  folderId: z.union([z.uuid('Invalid folder id'), z.literal('root')]),
});

export const presignUploadSchema = z.object({
  filename: z.string().trim().min(1, 'filename is required').max(255),
  mimeType: z.string().trim().min(1, 'mimeType is required').max(255),
  sizeBytes: z.coerce
    .number()
    .int()
    .positive('sizeBytes must be greater than zero')
    .max(MAX_UPLOAD_BYTES, `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit`),
  /** Exactly one owner. Omit to attach to the folder in the URL instead. */
  helpItemId: z.uuid('Invalid help item id').optional(),
});

export const confirmUploadSchema = z.object({
  /** The key returned by the presign step — not client-supplied freely. */
  storageKey: z.string().trim().min(1).max(512),
  sizeBytes: z.coerce.number().int().positive(),
});

export const assetIdParam = z.object({ id: z.uuid('Invalid asset id') });

/** `:itemId` path segment for the help-scoped media routes. */
export const itemIdParam = z.object({ itemId: z.uuid('Invalid help item id') });

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export type MediaAsset = {
  id: string;
  helpItemId: string | null;
  folderId: string | null;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  /** Null when the bucket is private or storage is unreachable. */
  url: string | null;
  createdAt: string;
};