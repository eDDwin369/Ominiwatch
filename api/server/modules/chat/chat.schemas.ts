import { z } from 'zod';

/**
 * Request contract for the AI chat proxy.
 *
 * `role` is restricted to the three values OpenRouter accepts. `content` is
 * capped so one request cannot be used to push an unbounded prompt onto the
 * deployment's account.
 */
export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(8000),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, 'At least one message is required')
    // Bounds the whole conversation, not just one turn.
    .max(40, 'Conversation too long — start a new chat'),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
