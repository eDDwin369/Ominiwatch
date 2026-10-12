/**
 * Drizzle Kit configuration.
 *
 * Generates SQL migrations from the TypeScript schema. The `dbCredentials`
 * section is only used by `drizzle-kit push`/studio — `generate` needs no
 * database connection, so migrations can be authored offline.
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db/schema/index.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/help',
  },
  strict: true,
  verbose: true,
});
