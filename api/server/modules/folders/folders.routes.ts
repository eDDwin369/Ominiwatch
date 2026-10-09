import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createFolderSchema,
  deleteFolderQuerySchema,
  folderIdParam,
  listFolderContentsQuerySchema,
  updateFolderSchema,
  type CreateFolderInput,
  type DeleteFolderQuery,
  type ListFolderContentsQuery,
  type UpdateFolderInput,
} from './folders.schemas.js';
import * as service from './folders.service.js';

export const foldersRouter = Router();

/** Every route needs a token; read visibility is filtered per role in the service. */
foldersRouter.use(requireAuth);

/** GET /api/folders — the full nested tree. */
foldersRouter.get('/', async (req: AuthenticatedRequest, res) => {
  res.json({ folders: await service.tree(req.auth!) });
});

/** GET /api/folders/:id/contents — child folders and help items. */
foldersRouter.get(
  '/:id/contents',
  validate({ params: folderIdParam, query: listFolderContentsQuerySchema }),
  async (req: AuthenticatedRequest, res) => {
    const query = req.query as unknown as ListFolderContentsQuery;
    res.json(await service.contents(req.params.id, query, req.auth!));
  },
);

/** GET /api/folders/:id/breadcrumb — root-to-here path. */
foldersRouter.get(
  '/:id/breadcrumb',
  validate({ params: folderIdParam }),
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    res.json(await service.breadcrumb(req.params.id, req.auth!));
  },
);

/** POST /api/folders — manager or superadmin. */
foldersRouter.post(
  '/',
  requireRole('manager', 'superadmin'),
  validate({ body: createFolderSchema }),
  async (req: AuthenticatedRequest<Record<string, string>, unknown, CreateFolderInput>, res) => {
    res.status(201).json({ folder: await service.create(req.body, req.auth!) });
  },
);

/** PATCH /api/folders/:id — rename / re-parent. */
foldersRouter.patch(
  '/:id',
  requireRole('manager', 'superadmin'),
  validate({ params: folderIdParam, body: updateFolderSchema }),
  async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateFolderInput>, res) => {
    res.json({ folder: await service.update(req.params.id, req.body, req.auth!) });
  },
);

/**
 * DELETE /api/folders/:id?moveItemsToRoot=true
 * 409 unless the caller opts into moving items to the root.
 */
foldersRouter.delete(
  '/:id',
  requireRole('manager', 'superadmin'),
  validate({ params: folderIdParam, query: deleteFolderQuerySchema }),
  async (req: AuthenticatedRequest, res) => {
    const query = req.query as unknown as DeleteFolderQuery;
    res.json(await service.remove(req.params.id, query, req.auth!));
  },
);
