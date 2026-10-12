/**
 * Express application assembly.
 *
 * Kept separate from `index.ts` so the app can be imported by tests without
 * binding a port.
 *
 * Middleware order matters and is deliberate:
 *   helmet/cors -> body parsers -> routers -> 404 -> error handler
 * `requirePasswordChanged` is registered per-router by each module, so a
 * superadmin is not blocked from changing their own bootstrap password.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { ping } from './db/client.js';
import { requireAuth } from './middleware/auth.js';
import { helpRouter } from './modules/help/help.routes.js';
import { foldersRouter } from './modules/folders/folders.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { chatRouter } from './modules/chat/chat.routes.js';
import { requirePasswordChanged } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { docsRouter } from './docs/openapi/mount.js';

export function createApp() {
  const app = express();

  // Behind a proxy/load balancer this makes req.ip and rate limiting correct.
  app.set('trust proxy', 1);

  /**
   * The API reference renders its UI from a small inline module script that
   * imports Scalar from a CDN, which helmet's default `script-src 'self'`
   * policy blocks outright (the page loads but never renders).
   *
   * CSP is disabled for the docs routes only. Every other route keeps helmet's
   * strict defaults.
   *
   * The docs router is mounted BEFORE the global helmet() rather than after,
   * and headers are last-write-wins: a path-scoped `helmet({...})` placed
   * before the global `helmet()` would be silently overwritten by it, so
   * mounting the router first is what actually keeps CSP off these two paths.
   */
  app.use('/', docsRouter);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      // Lets the frontend read the error code to route to the password screen.
      exposedHeaders: ['X-Request-Id'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  /**
   * Liveness/readiness in one: returns 503 when the database is unreachable,
   * so a load balancer stops sending traffic instead of serving 500s.
   */
  app.get('/health', async (_req, res) => {
    try {
      await ping();
      res.json({ status: 'ok', uptime: process.uptime(), env: env.NODE_ENV, db: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down' });
    }
  });

  /**
   * Help management only.
   *
   * There is deliberately no setup, auth or user-management API here: this
   * service owns help content, the folder tree and file uploads, and nothing
   * else. Accounts and sign-in belong to the system that hosts this API.
   *
   * Routes are still protected. `requireAuth` verifies the bearer token with the
   * shared JWT_SECRET, so a token minted elsewhere is accepted and an absent or
   * forged one is rejected. Nothing here issues tokens.
   *
   * Routers repeat `requireAuth` internally so they stay secure however they are
   * mounted; the double verify is cheap.
   */
  app.use('/api/help', requireAuth, requirePasswordChanged, helpRouter);
  app.use('/api/folders', requireAuth, requirePasswordChanged, foldersRouter);
  // File uploads. Mounted before the folders router because its paths start
  // with /api/folders/ — Express matches in registration order, and the folders
  // router's '/:id' routes would otherwise swallow them.
  app.use('/api', requireAuth, requirePasswordChanged, mediaRouter);
  // AI chat. Same auth as everything else: it spends real credit.
  app.use('/api', requireAuth, requirePasswordChanged, chatRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
