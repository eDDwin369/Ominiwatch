/**
 * JWT issuing and verification.
 *
 * The payload is deliberately minimal — identity and role only. Anything that
 * changes (email, name) is re-read from the database rather than trusted from
 * the token, so a stale token can never grant stale privileges.
 */
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from './errors.js';
import type { Role } from '../db/schema/enums.js';

export interface TokenPayload {
  sub: string;
  role: Role;
  tenantId: string;
}

export const signAccessToken = (payload: TokenPayload): string =>
  // `sub` is carried inside the payload; passing `subject` as a separate
  // option as well makes jsonwebtoken throw, so only the payload is used.
  jwt.sign({ ...payload }, env.JWT_SECRET, {
    // jsonwebtoken types `expiresIn` as a `ms`-style literal union; the value is
    // validated as a string in config/env.ts.
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    // `HS256` pinned explicitly so the algorithm can never be inferred
    // from the token header (blocks `alg: none` style attacks).
    algorithm: 'HS256',
  });

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded.sub) throw new Error('Malformed payload');
    return decoded as unknown as TokenPayload;
  } catch {
    // Never leak the underlying reason (expired vs malformed vs bad signature).
    throw unauthorized('Invalid or expired token');
  }
};
