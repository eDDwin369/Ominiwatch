/**
 * Typed application errors.
 *
 * Routes throw these; a single error-handling middleware turns them into
 * responses. That keeps error shaping out of every handler and guarantees a
 * consistent body shape for the frontend.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(message, 400, 'BAD_REQUEST', details);

export const unauthorized = (message = 'Authentication required') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const forbidden = (message = 'You do not have permission to perform this action') =>
  new AppError(message, 403, 'FORBIDDEN');

export const notFound = (message = 'Resource not found') =>
  new AppError(message, 404, 'NOT_FOUND');

export const conflict = (message: string) => new AppError(message, 409, 'CONFLICT');

export const unprocessable = (message: string, details?: unknown) =>
  new AppError(message, 422, 'UNPROCESSABLE', details);
