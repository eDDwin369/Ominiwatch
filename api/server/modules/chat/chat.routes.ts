import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { chatRequestSchema, type ChatRequestInput } from './chat.schemas.js';
import * as service from './chat.service.js';

export const chatRouter = Router();

/**
 * POST /api/chat
 *
 * Proxies one conversation turn to OpenRouter. Requires a token like every other
 * route — the endpoint spends real credit, so it must not be reachable
 * anonymously.
 */
chatRouter.post(
  '/chat',
  requireAuth,
  validate({ body: chatRequestSchema }),
  async (req: AuthenticatedRequest<Record<string, string>, unknown, ChatRequestInput>, res) => {
    res.json(await service.chat(req.body.messages));
  },
);
