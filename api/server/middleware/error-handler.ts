/**
 * Express 5 forwards rejected promises to the error handler automatically,
 * so async handlers do not need a try/catch wrapper.
 */
import type { NextFunction, Request, Response } from 'express';
import multerErrors from 'multer';
import { AppError } from '../lib/errors.js';

/** Terminal 404 handler for unmatched routes. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `No route matches ${req.method} ${req.path}` },
  });
};

/**
 * Central error handler.
 *
 * Known `AppError`s return their status, code and details. Anything else is
 * logged server-side and reported as a generic 500 so internals never reach
 * the client.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Multer surfaces upload problems as coded errors.
  if (err instanceof multerErrors.MulterError) {
    res.status(400).json({
      error: {
        code: 'UPLOAD_FAILED',
        message:
          err.code === 'LIMIT_FILE_SIZE'
            ? 'File exceeds the maximum allowed size'
            : err.message,
      },
    });
    return;
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
};
