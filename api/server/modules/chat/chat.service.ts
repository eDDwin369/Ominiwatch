/**
 * AI chat, proxied to our self-hosted Ollama instance.
 *
 * The request goes through this service rather than from the browser for one
 * reason: the Ollama proxy key is a bearer-equivalent credential, and anything
 * the browser holds is readable by anyone with devtools. The key stays in the
 * server environment and never reaches the client.
 *
 * The model is fixed to one value on purpose. Letting a client choose the model
 * would let it spend the deployment's shared compute on an expensive one.
 *
 * The proxy's request shape is unusual by design, not a mistake here: every
 * call is a POST to OLLAMA_BASE_URL with a JSON body {key, path, payload} -
 * the proxy's own edge (Cloudflare) blocks random-looking key values sent as
 * a header or query param, but not inside a body, so this is the proxy's one
 * documented, reliable calling convention (see OLLAMA_API_ACCESS_GUIDE.md).
 */
import { env } from '../../config/env.js';
import { badRequest, AppError } from '../../lib/errors.js';

/** Message shape Ollama's /api/chat accepts, narrowed to what this app sends. */
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatReply = { reply: string; model: string };

/** Keeps one turn from consuming an unbounded amount of the shared model's output. */
const MAX_TOKENS = 900;

/** Upstream rate limits on the shared pool are transient, so a turn is retried. */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a conversation to the self-hosted Ollama model and returns the
 * assistant's text.
 *
 * Retries on 429 and 5xx. Both are transient by nature — the model is served
 * from a shared on-prem instance, so "temporarily busy" is a normal response
 * rather than a configuration error, and failing the user's message
 * immediately would be needlessly brittle.
 *
 * Errors are mapped onto this API's own vocabulary. Upstream codes the caller
 * can act on are preserved; anything ambiguous becomes 502.
 */
export async function chat(messages: ChatMessage[]): Promise<ChatReply> {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw badRequest('messages must be a non-empty array');
  }

  let lastMessage = 'Ollama request failed';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(env.OLLAMA_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: env.OLLAMA_API_KEY,
        path: '/api/chat',
        payload: {
          model: env.OLLAMA_DEFAULT_MODEL,
          messages,
          // Non-streaming: the panel renders a completed message, and a stream
          // would need event-source plumbing on both sides for no visible gain.
          stream: false,
          options: { num_predict: MAX_TOKENS },
        },
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { message?: { content?: string }; error?: string }
      | null;

    if (response.ok) {
      const reply = body?.message?.content?.trim();
      if (!reply) {
        lastMessage = 'Ollama returned an empty completion';
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_BASE_MS * attempt);
          continue;
        }
        throw new AppError(lastMessage, 502, 'UPSTREAM_ERROR');
      }
      return { reply, model: env.OLLAMA_DEFAULT_MODEL };
    }

    lastMessage = body?.error ?? `Ollama request failed (HTTP ${response.status})`;

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_BASE_MS * attempt);
      continue;
    }

    // 401/403 mean the proxy key is wrong/missing - a configuration problem,
    // not the caller's fault, so it must not be reported as a bad request.
    const status =
      response.status === 401 || response.status === 403
        ? 503
        : response.status === 429
          ? 429
          : 502;

    throw new AppError(lastMessage, status, 'UPSTREAM_ERROR');
  }

  throw new AppError(lastMessage, 502, 'UPSTREAM_ERROR');
}
