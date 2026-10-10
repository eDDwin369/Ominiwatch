/**
 * Request validation.
 *
 * `validate({ body, query, params })` parses each part with a Zod schema and
 * replaces the raw value with the parsed result, so handlers receive coerced,
 * correctly typed data instead of unvalidated strings.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { unprocessable } from '../lib/errors.js';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const issues: { path: string; message: string }[] = [];

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = (schema as z.ZodTypeAny).safeParse(req[part]);
      if (result.success) {
        // Express 5 exposes `req.query` via a getter, so assign defensively.
        if (part === 'query') {
          Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
        } else {
          req[part] = result.data;
        }
      } else {
        for (const issue of result.error.issues) {
          issues.push({ path: `${part}.${issue.path.join('.')}`, message: issue.message });
        }
      }
    }

    if (issues.length > 0) throw unprocessable('Request validation failed', issues);
    next();
  };
