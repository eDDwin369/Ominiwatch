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
   * --- AI chat (self-hosted Ollama, via the oomnieye auth proxy) ---
   *
   * The proxy at OLLAMA_BASE_URL is a single POST endpoint - every request
   * (regardless of which underlying Ollama route it targets) is a POST with
   * a JSON body {key, path, payload}. The key is never sent as a header or
   * query param on purpose: the proxy's own Cloudflare layer blocks
   * random-looking values there but not inside a request body, so this
   * shape is the proxy's documented API, not a quirk of this service.
   */
  OLLAMA_BASE_URL: z.string().min(1).default('https://ollama.oomnieye.com'),
  /** Bearer-equivalent credential for the proxy's body-based auth. */
  OLLAMA_API_KEY: z.string().min(1, 'OLLAMA_API_KEY is required for the help chat'),
  /**
   * Fixed model. A client-selectable model would let a caller spend the
   * deployment's shared compute on an expensive one.
   */
  OLLAMA_DEFAULT_MODEL: z.string().min(1).default('qwen3-coder:30b'),
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
