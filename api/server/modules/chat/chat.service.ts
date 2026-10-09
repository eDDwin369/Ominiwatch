/**
 * AI chat, proxied to OpenRouter.
 *
 * The request goes through this service rather than from the browser for one
 * reason: the OpenRouter key is a bearer credential, and anything the browser
 * holds is readable by anyone with devtools. The key stays in the server
 * environment and never reaches the client.
 *
 * The model is fixed to one value on purpose. Letting a client choose the model
 * would let it select an expensive one on the deployment's account.
 */
import { env } from '../../config/env.js';
import { badRequest, AppError } from '../../lib/errors.js';

/** Message shape OpenRouter accepts, narrowed to what this app sends. */
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatReply = { reply: string; model: string };

/** Keeps one turn from consuming an unbounded amount of the account's credit. */
const MAX_TOKENS = 900;

/** Upstream rate limits on the shared pool are transient, so a turn is retried. */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a conversation to OpenRouter and returns the assistant's text.
 *
 * Retries on 429 and 5xx. Both are transient by nature — the model is served
 * from a shared upstream pool, so "temporarily rate-limited" is a normal
 * response rather than a configuration error, and failing the user's message
 * immediately would be needlessly brittle.
 *
 * Errors are mapped onto this API's own vocabulary. Upstream codes the caller
 * can act on are preserved; anything ambiguous becomes 502.
 */
export async function chat(messages: ChatMessage[]): Promise<ChatReply> {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw badRequest('messages must be a non-empty array');
  }

  let lastMessage = 'OpenRouter request failed';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        // Non-streaming: the panel renders a completed message, and a stream
        // would need event-source plumbing on both sides for no visible gain.
        stream: false,
        // Let OpenRouter route around a saturated provider rather than failing.
        provider: { allow_fallbacks: true },
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | {
          choices?: { message?: { content?: string } }[];
          error?: { message?: string; code?: number; metadata?: { raw?: string } };
        }
      | null;

    if (response.ok) {
      const reply = body?.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        lastMessage = 'OpenRouter returned an empty completion';
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_BASE_MS * attempt);
          continue;
        }
        throw new AppError(lastMessage, 502, 'UPSTREAM_ERROR');
      }
      return { reply, model: env.OPENROUTER_MODEL };
    }

    // `error.metadata.raw` is where OpenRouter puts the actionable sentence,
    // e.g. "temporarily rate-limited upstream. Please retry shortly". The
    // top-level message is only ever "Provider returned error".
    lastMessage =
      body?.error?.metadata?.raw ??
      body?.error?.message ??
      `OpenRouter request failed (HTTP ${response.status})`;

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_BASE_MS * attempt);
      continue;
    }

    // 401/402/403 are configuration or billing problems, not the caller's fault,
    // so they must not be reported as a bad request.
    const status =
      response.status === 401 || response.status === 402 || response.status === 403
        ? 503
        : response.status === 429
          ? 429
          : 502;

    throw new AppError(lastMessage, status, 'UPSTREAM_ERROR');
  }

  throw new AppError(lastMessage, 502, 'UPSTREAM_ERROR');
}