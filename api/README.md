# Help-management API

The API service for help content, the folder tree, and file uploads.

This is a **separate service**, deliberately self-contained: it has its own
`package.json`, its own `node_modules`, and its own build. The hosting app at the
repo root does not depend on it, and nothing here is imported by `src/`. It runs
as its own process.

## Why it is separate

The hosting app is a TanStack Start SPA whose sign-in is demo-based: any password
is accepted and the session lives in `localStorage`. That flow is intentionally
untouched — this service is additive.

Because of that, **the running app does not call these endpoints yet.** It reaches
them by pointing its own auth at this API; until that happens, this service is
consumed directly (via `/docs`) or by whatever client is wired to it.

## Running it

```bash
cd api
npm install
cp .env.example .env      # then fill in DATABASE_URL, JWT_SECRET, SUPERADMIN_*, S3_*
npm run build             # tsc -> dist-server, then copies migrations in
npm start                 # serves on $PORT (default 3000)
```

For development with reload: `npm run dev`.

The interactive reference is at **http://localhost:$PORT/docs** and the raw spec
at `/openapi.json`. Both cover help, folders and media only — setup, auth and
user management are deliberately excluded from the document, though the routes
still exist.

Create the first superadmin once with:

```bash
curl -X POST localhost:3000/api/setup
```

It reads `SUPERADMIN_*` from the environment and takes **no request body**, so a
caller cannot choose the credentials. It returns 409 if a superadmin already
exists. Set `SETUP_DISABLED=true` afterwards to shut it down permanently.

## Why `npm run build` copies files

`tsc` emits only `.js`, so the Drizzle migration files (`.sql` plus the meta
journal) would be missing from `dist-server`. The server resolves that directory
relative to its compiled self at boot, so without the copy it exits 1 with
`Can't find meta/_journal.json` — a crash loop in any container built from the
compiled output. `scripts/copy-assets.mjs` performs the copy.

## File uploads

Uploads use presigned S3 PUTs. The API authorises and records the asset; the
browser sends the bytes straight to S3, so no file passes through this process
and memory stays flat regardless of file size. The flow is three steps:

1. `POST /api/folders/{id}/media/presign` — returns a presigned PUT URL
2. `PUT` the bytes to that URL, directly to S3
3. `POST /api/folders/{id}/media` — records the asset

Step 3 exists because step 2 can fail silently: a dropped connection looks
identical to a success from the browser's side.

A `media_assets` row has at most one owner — a folder or a help item, never both.
No owner means the `root` pseudo-folder. That invariant is a CHECK constraint in
migration `0001`, not a TypeScript type, so a bad write from any other client is
rejected too.

Deleting an asset removes the database row only. The S3 object is left for a
bucket lifecycle rule to expire, so the request does not depend on S3 being
reachable.

## Environment

All values are required at boot except the two optional S3 overrides, so a
partially configured deployment fails loudly rather than at the first request.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. `pglite://memory` runs in-process for tests. |
| `JWT_SECRET` | Signing key. Minimum 32 characters. No default — generate per deployment. |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` / `SUPERADMIN_NAME` | Consumed once by `POST /api/setup`. |
| `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage. |
| `S3_ENDPOINT` | Optional. For MinIO / R2 / Spaces. |
| `S3_PUBLIC_BASE_URL` | Optional. Set when a CDN fronts the bucket. |
| `SETUP_DISABLED` | Set `true` once the first superadmin exists. |

The bucket is expected to be public-read. Create an IAM user with only
`s3:PutObject` — the API never needs delete or list.

## Tests

```bash
npm test
```

Runs against in-process Postgres (PGlite), so no database or network is needed.
Covers the help review workflow, folder tree, media validation, and the generated
OpenAPI document.
