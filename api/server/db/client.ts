/**
 * Database connection factory.
 *
 * This is the ONLY module that knows what database engine is running. Every
 * other module imports `db` and the typed schema from here, so the driver is
 * swappable without touching a single route or service.
 *
 * Two backends, chosen by the URL scheme:
 *   postgresql://  managed Postgres (Neon in production) via node-postgres
 *   pglite://      in-process Postgres (WASM) — tests only, no network
 *
 * PGlite is byte-for-byte real PostgreSQL (ENUMs, FKs, transactions), so
 * tests exercise the same semantics as production.
 */
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

export const isPGlite = env.DATABASE_URL.startsWith('pglite:');

/** node-postgres pool. Present only for the `postgresql://` backend. */
export const pool: Pool | null = isPGlite
  ? null
  : new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      // Neon terminates TLS with a public CA; `pg` negotiates it from the
      // sslmode parameter on the connection string.
      ssl: env.DATABASE_URL.includes('sslmode=') ? { rejectUnauthorized: false } : undefined,
    });

if (pool) {
  /**
   * Pooled providers multiplex connections. `pg` can otherwise hold an idle
   * client that the pooler has already discarded.
   */
  pool.on('error', (err) => {
    console.error('[db] idle client error:', err.message);
  });
}

/**
 * In-process Postgres instance. Present only for the `pglite://` backend.
 * Data lives in memory and vanishes with the process — exactly what tests want.
 */
export const pglite: PGlite | null = isPGlite ? new PGlite() : null;

/**
 * Single static type for both backends.
 *
 * PGlite implements the same Drizzle query-builder surface (select / insert /
 * update / delete / transaction / relational queries) over the same schema,
 * so one type serves both. The test suite — which runs entirely on PGlite —
 * is the proof: any missing method would fail there at runtime.
 */
export const db: NodePgDatabase<typeof schema> = (isPGlite
  ? drizzlePglite(pglite!, { schema, casing: 'snake_case' })
  : drizzlePg(pool!, { schema, casing: 'snake_case' })) as NodePgDatabase<typeof schema>;

export type Database = typeof db;
export { schema };

/**
 * Applies pending SQL migrations from `server/db/migrations`.
 * Safe to call on every boot — already-applied migrations are skipped.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = new URL('./migrations', import.meta.url).pathname;
  if (isPGlite) {
    // At runtime `db` IS the PGlite instance here; only the static type is shared.
    await migratePglite(db as unknown as PgliteDatabase<typeof schema>, { migrationsFolder });
  } else {
    await migratePg(db, { migrationsFolder });
  }
}

/**
 * Drops everything this app owns and re-migrates from scratch.
 * TESTS ONLY — refuses to run outside `NODE_ENV=test`.
 */
export async function resetDatabase(): Promise<void> {
  if (env.NODE_ENV !== 'test') {
    throw new Error('resetDatabase is only allowed in test mode');
  }
  // PGlite's `exec` runs a multi-statement script directly; node-postgres
  // prepared statements accept only one command, so statements go one by one.
  const statements = [
    'DROP TABLE IF EXISTS media_assets CASCADE',
    'DROP TABLE IF EXISTS help_item_events CASCADE',
    'DROP TABLE IF EXISTS help_items CASCADE',
    'DROP TABLE IF EXISTS help_folders CASCADE',
    'DROP TABLE IF EXISTS users CASCADE',
    'DROP TYPE IF EXISTS review_action CASCADE',
    'DROP TYPE IF EXISTS content_type CASCADE',
    'DROP TYPE IF EXISTS archive_status CASCADE',
    'DROP TYPE IF EXISTS help_status CASCADE',
    'DROP TYPE IF EXISTS role CASCADE',
  ];
  if (isPGlite) {
    await pglite!.exec(statements.join('; ') + ';');
  } else {
    for (const statement of statements) {
      await pool!.query(statement);
    }
  }
  await runMigrations();
}

/**
 * Verifies connectivity.
 * Used by the health endpoint so a broken DB is visible immediately.
 */
export async function ping(): Promise<void> {
  if (pool) await pool.query('select 1');
  else await pglite!.query('select 1');
}

/** Closes connections. Called on shutdown so handles are not leaked. */
export async function closeDb(): Promise<void> {
  if (pool) await pool.end();
  if (pglite) await pglite.close();
}

/** Backwards-compatible alias. */
export const closePool = closeDb;
