/**
 * Copies non-TypeScript runtime assets into the compiled output.
 *
 * `tsc` only emits `.js`, so the Drizzle migration files (.sql and the meta
 * journal) would be missing from `dist-server`. The server resolves that folder
 * relative to itself at boot, so without this copy it exits 1 with
 * "Can't find meta/_journal.json" — which is exactly what a container built from
 * the compiled output would hit.
 */
import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const from = join(apiRoot, 'server', 'db', 'migrations');
const to = join(apiRoot, 'dist-server', 'server', 'db', 'migrations');

await mkdir(dirname(to), { recursive: true });
await cp(from, to, { recursive: true });

console.log(`[build] migrations copied -> ${to}`);