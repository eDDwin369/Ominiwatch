/**
 * Shared error envelope.
 *
 * Every failure in this API uses the same shape (see `lib/errors.ts` and the
 * error-handling middleware), so it is declared once here and referenced by all
 * documented error responses.
 */
import { z } from 'zod';

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z
      .enum(['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'UNPROCESSABLE', 'INTERNAL'])
      .describe('Machine-readable error code.'),
    message: z.string().describe('Human-readable explanation. Safe to surface in the UI.'),
    details: z
      .unknown()
      .optional()
      .describe('Present on UNPROCESSABLE: an array of { path, message } naming each bad field.'),
  }),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;