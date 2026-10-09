import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createHelpItemSchema,
  idParam,
  listHelpItemsQuerySchema,
  reviewHelpItemSchema,
  updateHelpItemSchema,
  type CreateHelpItemInput,
  type ListHelpItemsQuery,
  type ReviewHelpItemInput,
  type UpdateHelpItemInput,
} from './help.schemas.js';
import * as service from './help.service.js';

export const helpRouter = Router();

/** `/api/help/:id` handlers all receive a validated UUID in params. */
type ItemRequest<Body = unknown> = AuthenticatedRequest<{ id: string }, unknown, Body>;

/**
 * Every help route requires a valid token. Visibility beyond that is decided
 * inside the service by role — customers are transparently limited to
 * approved content.
 */
helpRouter.use(requireAuth);

/** GET /api/help — list, paginated and filtered. */
helpRouter.get(
  '/',
  validate({ query: listHelpItemsQuerySchema }),
  async (req: AuthenticatedRequest, res) => {
    // Safe cast: `validate` above already parsed and replaced req.query with
    // this exact shape. Express types req.query as ParsedQs, which is too
    // loose to carry the validated result.
    res.json(await service.list(req.query as unknown as ListHelpItemsQuery, req.auth!));
  },
);

/** GET /api/help/stats — status counters. */
helpRouter.get('/stats', async (req: AuthenticatedRequest, res) => {
  res.json(await service.stats(req.auth!));
});

/** GET /api/help/:id */
helpRouter.get('/:id', validate({ params: idParam }), async (req: ItemRequest, res) => {
  res.json({ item: await service.getById(req.params.id, req.auth!) });
});

/** GET /api/help/:id/history — audit trail, authors only. */
helpRouter.get('/:id/history', validate({ params: idParam }), async (req: ItemRequest, res) => {
  res.json(await service.getHistory(req.params.id, req.auth!));
});

/** POST /api/help — manager or superadmin. */
helpRouter.post(
  '/',
  requireRole('manager', 'superadmin'),
  validate({ body: createHelpItemSchema }),
  async (req: AuthenticatedRequest<Record<string, string>, unknown, CreateHelpItemInput>, res) => {
    res.status(201).json({ item: await service.create(req.body, req.auth!) });
  },
);

/** PATCH /api/help/:id — author or superadmin. */
helpRouter.patch(
  '/:id',
  requireRole('manager', 'superadmin'),
  validate({ params: idParam, body: updateHelpItemSchema }),
  async (req: ItemRequest<UpdateHelpItemInput>, res) => {
    res.json({ item: await service.update(req.params.id, req.body, req.auth!) });
  },
);

/** POST /api/help/:id/review — superadmin only. */
helpRouter.post(
  '/:id/review',
  requireRole('superadmin'),
  validate({ params: idParam, body: reviewHelpItemSchema }),
  async (req: ItemRequest<ReviewHelpItemInput>, res) => {
    res.json({ item: await service.review(req.params.id, req.body, req.auth!) });
  },
);

/** POST /api/help/:id/resubmit — author or superadmin. */
helpRouter.post('/:id/resubmit', validate({ params: idParam }), async (req: ItemRequest, res) => {
  res.json({ item: await service.resubmit(req.params.id, req.auth!) });
});

/** POST /api/help/:id/archive — soft delete. */
helpRouter.post('/:id/archive', validate({ params: idParam }), async (req: ItemRequest, res) => {
  res.json({ item: await service.setArchived(req.params.id, true, req.auth!) });
});

/** POST /api/help/:id/restore */
helpRouter.post('/:id/restore', validate({ params: idParam }), async (req: ItemRequest, res) => {
  res.json({ item: await service.setArchived(req.params.id, false, req.auth!) });
});
