/**
 * Server entrypoint.
 *
 * Migrations run before the port opens, so the API never serves a request
 * against a schema that does not exist yet.
 */
import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/client.js';

async function main() {
  try {
    await runMigrations();
    console.log('[db] migrations applied');
  } catch (err) {
    console.error('[db] migration failed:', err);
    process.exit(1);
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}`);
    console.log(`[api] env=${env.NODE_ENV} cors=${env.CORS_ORIGIN.join(',')}`);
  });
}

// Fail fast on unhandled rejections instead of running in a broken state.
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandled rejection:', reason);
  process.exit(1);
});

main();
