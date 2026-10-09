/**
 * Shared Vitest setup for API tests.
 *
 * Tests run against in-process Postgres (PGlite, `pglite://memory`), selected
 * by TEST_DATABASE_URL. Same engine semantics as production Neon — ENUMs, FKs,
 * transactions — with no network and no cleanup between runs.
 */
import { beforeAll, afterAll } from 'vitest';

// Must run before `server/config/env.ts` is imported anywhere.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'pglite://memory';
// The setup endpoint needs bootstrap credentials; tests override per file.
// Storage config is required at boot like everything else. Tests never reach S3 —
// they assert on the validation and key-building rules, which are pure — so
// throwaway credentials are fine here.




// Explicit, so the suite is hermetic. Without this it only passed because a
// developer's local .env happened to define JWT_SECRET — so a clean checkout or
// CI run would fail at import time with "JWT_SECRET: expected string, received
// undefined". A fixed test value is correct here: tokens are signed and verified
// in-process, so nothing outside this run depends on it.
process.env.JWT_SECRET ??= 'test-only-jwt-secret-not-used-anywhere-32ch+';
// Storage is never contacted by the suite: upload URLs are only minted, never
// used, and URL resolution degrades to null when the provider is unreachable.
// A placeholder token is therefore correct here.
process.env.UPSTASH_BLOB_TOKEN ??= 'test-placeholder-token';

let app: ReturnType<typeof import('../app.js').createApp> | null = null;

export async function getApp() {
  if (!app) {
    const { createApp } = await import('../app.js');
    app = createApp();
  }
  return app;
}

export async function resetDatabase(): Promise<void> {
  const { resetDatabase: reset } = await import('../db/client.js');
  await reset();
}

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  const { closeDb } = await import('../db/client.js');
  await closeDb();
});
