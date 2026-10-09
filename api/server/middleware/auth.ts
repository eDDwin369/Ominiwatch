/**
 * Auth middleware: `requireAuth` and `requireRole`.
 *
 * Roles are checked server-side on every request. Hiding UI controls in the
 * frontend is a convenience only — it is never the security boundary.
 */
import type { Request, RequestHandler } from 'express';
import type { ParsedQs } from 'qs';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client.js';
import { verifyAccessToken, type TokenPayload } from '../lib/jwt.js';
import { AppError, forbidden, unauthorized } from '../lib/errors.js';
import type { Role } from '../db/schema/enums.js';

/**
 * Blocks everything except the endpoints a user must reach before they have a
 * usable password (and therefore before they can do anything else).
 *
 * Applied globally: an account flagged `mustChangePassword` can only call
 * `/api/auth/change-password` and `/api/auth/me`. Because the flag is read
 * from the database on each request, revoking it takes effect immediately.
 */
export const requirePasswordChanged: RequestHandler = async (req, _res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) return next();

  // The auth module and the change-password endpoint are always reachable.
  if (req.path.startsWith('/auth/')) return next();

  const row = await db.query.users.findFirst({
    where: eq(schema.users.id, auth.sub),
    columns: { isActive: true, mustChangePassword: true },
  });

  if (!row || !row.isActive) throw unauthorized('Account is no longer active');
  if (row.mustChangePassword) {
    throw new AppError(
      'Password change required before continuing',
      403,
      'PASSWORD_CHANGE_REQUIRED',
    );
  }

  next();
};

/**
 * A request known to carry a verified token.
 *
 * Generic over the Express parts so handlers can declare concrete params,
 * e.g. `AuthenticatedRequest<{ id: string }>`.
 */
export interface AuthenticatedRequest<
  Params = Record<string, string>,
  // `any` (not `unknown`) so this stays assignable to Express's own
  // `RequestHandler`, which defaults the response body to `any`.
  ResBody = any,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  auth?: TokenPayload;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw unauthorized('Missing Authorization header');
  }

  (req as AuthenticatedRequest).auth = verifyAccessToken(header.slice(7).trim());
  next();
};

/**
 * Restricts a route to specific roles. Must be registered after `requireAuth`.
 *
 * Usage: `router.get('/queue', requireAuth, requireRole('superadmin'), handler)`
 */
export const requireRole =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) throw unauthorized();
    if (!allowed.includes(auth.role)) {
      throw forbidden(`Requires one of: ${allowed.join(', ')}`);
    }
    next();
  };
