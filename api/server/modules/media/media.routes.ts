import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  assetIdParam,
  itemIdParam,
  confirmUploadSchema,
  presignUploadSchema,
  uploadTargetSchema,
  type ConfirmUploadInput,
  type PresignUploadInput,
} from './media.schemas.js';
import * as service from './media.service.js';

export const mediaRouter = Router();

/** Every route needs a token; reads are tenant-scoped. */
mediaRouter.use(requireAuth);

/**
 * Resolves the `:folderId` path segment to a nullable id.
 *
 * The literal `root` means "no folder", matching the convention used by the help
 * list query.
 */
function resolveFolderId(raw: string): string | null {
  return raw === 'root' ? null : raw;
}

/** GET /api/folders/:folderId/media — assets filed directly in a folder. */
mediaRouter.get(
  '/folders/:folderId/media',
  validate({ params: uploadTargetSchema }),
  async (req: AuthenticatedRequest<{ folderId: string }>, res) => {
    const folderId = resolveFolderId(req.params.folderId);
    const assets = folderId
      ? await service.listFolderAssets(folderId, req.auth!)
      : await service.listRootAssets(req.auth!);
    res.json({ assets });
  },
);

/**
 * POST /api/folders/:folderId/media/presign — step 1 of an upload.
 *
 * Returns a presigned PUT URL. The client uploads the bytes directly to S3 with
 * it, so the file never passes through this process.
 */
mediaRouter.post(
  '/folders/:folderId/media/presign',
  requireRole('manager', 'superadmin'),
  validate({ params: uploadTargetSchema, body: presignUploadSchema }),
  async (req: AuthenticatedRequest<{ folderId: string }, unknown, PresignUploadInput>, res) => {
    const folderId = resolveFolderId(req.params.folderId);
    res.json(await service.presignUpload(req.body, folderId, req.auth!));
  },
);

/** POST /api/folders/:folderId/media — step 3, record a completed upload. */
mediaRouter.post(
  '/folders/:folderId/media',
  requireRole('manager', 'superadmin'),
  validate({ params: uploadTargetSchema, body: confirmUploadSchema }),
  async (req: AuthenticatedRequest<{ folderId: string }, unknown, ConfirmUploadInput>, res) => {
    const folderId = resolveFolderId(req.params.folderId);
    res.status(201).json({ asset: await service.confirmUpload(req.body, folderId, req.auth!) });
  },
);

/** GET /api/help/:itemId/media — assets attached to a help item. */
mediaRouter.get(
  '/help/:itemId/media',
  validate({ params: itemIdParam }),
  async (req: AuthenticatedRequest<{ itemId: string }>, res) => {
    res.json({ assets: await service.listItemAssets(req.params.itemId, req.auth!) });
  },
);

/** DELETE /api/media/:id — remove an asset record. */
mediaRouter.delete(
  '/media/:id',
  requireRole('manager', 'superadmin'),
  validate({ params: assetIdParam }),
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    await service.deleteAsset(req.params.id, req.auth!);
    res.json({ deleted: true });
  },
);