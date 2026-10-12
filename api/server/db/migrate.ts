/**
 * Standalone migration runner.
 *
 * The server also migrates on boot; this exists for deploying migrations as a
 * separate step (recommended in production, where app instances should not
 * race to migrate).
 *
 *   npm run db:migrate
 */
import { runMigrations } from './client.js';

runMigrations()
  .then(() => {
    console.log('[db] migrations applied');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[db] migration failed:', err);
    process.exit(1);
  });
