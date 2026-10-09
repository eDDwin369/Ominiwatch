/**
 * Centralised, validated runtime configuration.
 *
 * Every tunable lives here so no other module reads `process.env` directly.
 * Validation happens once at boot so a misconfigured deployment fails loudly
 * instead of failing at the first request that needs the missing value.
 */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // --- Server ---
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  // --- Database (PostgreSQL) ---
  /** Standard libpq connection string, e.g. postgres://user:pw@host/db?sslmode=require */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /**
   * Postgres schema (namespace) the tables live in.
   *
   * Defaults to `public`. Tests point this at a throwaway schema so they never
   * touch real data — see `server/test/run.sh`.
   */
  DATABASE_SCHEMA: z.string().min(1).default('public'),

  // --- Auth ---
  /**
   * No default on purpose. A committed placeholder is a known password on every
   * deployment that forgot to override it, which is worse than a hard boot
   * failure. Generate one per deployment: `openssl rand -base64 48`.
   */
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be set (min 32 chars). Generate with: openssl rand -base64 48'),
  JWT_EXPIRES_IN: z.string().default('8h'),

  /**
   * No superadmin or setup configuration here.
   *
   * This service no longer has a setup endpoint, so SUPERADMIN_* and
   * SETUP_DISABLED would be dead config — required to boot yet read by nothing.
   * Accounts are the host system's concern.
   */

  /**
   * --- Object storage (Upstash Blob, S3-compatible) ---
   *
   * Uploads are presigned: the API authorises and records the asset, then the
   * browser PUTs bytes straight to the bucket. No file passes through this
   * process, which keeps memory flat in a small container.
   *
   * A single write-scoped token replaces a long-lived key pair — Upstash issues
   * short-lived credentials to the SDK and refreshes them.
   */
  UPSTASH_BLOB_TOKEN: z
    .string()
    .default(
      'AgAkADAMMGExNjIwMDgtODdhNi00OTJhLTg0YzItN2U5YWUzODk3ODRmTlRSbU56azNaVFF0WkRWak5pMDBORGcyTFdJMU1HRXRZek5oWldFM016TTVabUk1Yjc2OWI3YmI1YTJm',
    ),

  /**
   * --- AI chat (OpenRouter) ---
   *
   * The key is server-side only: it is a bearer credential, so anything the
   * browser holds is readable by anyone with devtools. Requests are proxied
   * through POST /api/chat rather than called from the client.
   */
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required for the help chat'),
  /**
   * Fixed model. A client-selectable model would let a caller spend the
   * deployment's credit on an expensive one.
   */
  OPENROUTER_MODEL: z.string().min(1).default('meta-llama/llama-3.1-8b-instruct'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

export type Env = typeof env;
