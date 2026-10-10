import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest configuration for the help-management API.
 *
 * Scoped to `server/test` on purpose. Without an explicit `include`, Vitest
 * walks up and picks up the hosting app's Vite config — which in this repo is a
 * TanStack Start SPA config whose plugins try to resolve `src/router` and fail,
 * since this service has no frontend. Keeping the config local and narrow is
 * what makes `npm test` work from inside `api/`.
 *
 * Tests import the Express app directly and exercise it with supertest, so no
 * port is ever bound.
 */
export default defineConfig({
  test: {
    // Fresh module registry per file — no leaked database pools.
    pool: 'forks',
    // Sequential: the API tests share a single in-process database.
    sequence: { shuffle: false },
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['server/test/**/*.test.ts'],
    setupFiles: ['./server/test/setup.ts'],
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@server': path.resolve(here, './server'),
    },
  },
});