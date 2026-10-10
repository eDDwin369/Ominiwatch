# API — Help Management

Backend for the help-management system: **customer → manager → superadmin**.

```
customer   right-clicks any element and reads help for it
manager    authors help (text/PDF/image/video), edits it, submits for review
superadmin approves or rejects with a reason; only then is it visible
```

## Stack

| Concern    | Choice                                       |
| ---------- | -------------------------------------------- |
| Runtime    | Node 20 + Express 5                          |
| ORM        | Drizzle ORM + drizzle-kit                    |
| Database   | PostgreSQL (Neon hosted, PGlite in-process for tests) |
| Auth       | JWT (HS256) + bcrypt                         |
| Validation | Zod at the HTTP boundary                     |
| Dev runner  | `tsx` (TypeScript, no build step)            |

`better-sqlite3` and Prisma are intentionally **not** used: both need a native
compiler, which this machine does not have (`make`/`g++` missing).
`@libsql/client` ships a prebuilt binary, so installs work anywhere.

## Getting started

```bash
npm install
cp .env.example .env          # then set DATABASE_URL, JWT_SECRET, SUPERADMIN_*
npm run db:migrate            # create tables on your Postgres
curl -X POST localhost:3000/api/setup   # one-time: creates the superadmin
npm run api                   # API on :3000  (auto-migrates on boot)
npm run dev                   # Vite on :5173 (proxies /api -> :3000)
```

There is no self-registration. After setup, sign in as the superadmin and
create manager/customer accounts via `POST /api/users`. New accounts must
change their password on first login before any other endpoint works.

## Layout

```
server/
├── index.ts                 # entrypoint: migrate, then listen
├── app.ts                   # express app assembly (importable by tests)
├── config/env.ts            # ALL env access + boot-time validation
├── db/
│   ├── client.ts            # the ONLY file that knows the driver
│   ├── schema/              # one file per entity; barrelled in index.ts
│   ├── migrations/          # generated SQL, applied on boot
│   ├── migrate.ts           # standalone migration step
│   └── seed.ts              # idempotent demo data
├── lib/                     # jwt, password, errors, ids
├── middleware/              # auth, validate, error-handler
├── modules/                 # feature folders: routes + schemas + service
│   ├── auth/
│   ├── folders/
│   └── help/
└── test/
    ├── api.e2e.sh           # 35 assertions — approval workflow
    └── folders.e2e.sh      # 36 assertions — tree + file management
```

Each feature folder separates **routes** (HTTP shape), **schemas** (Zod
contracts) and **service** (business rules), so adding an endpoint never means
rewriting existing ones.

## Workflow rules (enforced server-side)

- Customers read **only** `approved` + `active` items. A pending item is
  invisible to them, and a direct fetch returns `404`, not `403`, so they
  cannot even infer that unpublished content exists.
- A manager's new item starts `pending`. A superadmin's new item is published
  immediately.
- **Editing approved content un-publishes it.** `contentVersion` increments,
  status reverts to `pending`, and `approvedBy`/`approvedAt` are cleared, so
  customers never see unreviewed changes. A superadmin editing approved content
  stays approved.
- `approvedContentVersion` records which version was reviewed, so an approval
  can never be stale.
- Rejection requires a reason. Rejected items can be resubmitted for another
  pass.
- Every transition writes an audit row in the **same transaction** as the item
  change, so history can never drift from state.
- Every read/write is scoped by `tenantId`.

## Endpoints

```
POST   /api/setup                public, one-time -> creates the superadmin
GET    /api/setup/status         public -> { setupRequired, completed }

POST   /api/auth/login           public   -> { token, user }
GET    /api/auth/me              any role
POST   /api/auth/change-password any role -> clears mustChangePassword

GET    /api/users                superadmin
POST   /api/users                superadmin -> manager or customer only
PATCH  /api/users/:id            superadmin
DELETE /api/users/:id            superadmin -> soft delete (deactivate)

GET    /api/help                 any role (customers: approved only)
GET    /api/help/stats           any role
GET    /api/help/:id             any role
GET    /api/help/:id/history     manager, superadmin
POST   /api/help                 manager, superadmin
PATCH  /api/help/:id             author, superadmin
POST   /api/help/:id/review      superadmin   { decision, reason? }
POST   /api/help/:id/resubmit    author, superadmin
POST   /api/help/:id/archive     author, superadmin
POST   /api/help/:id/restore     author, superadmin
```

## Folders and files

Content is organised as a **folder tree**; help items are the files inside it.

```
GET    /api/folders                          any role — nested tree
GET    /api/folders/:id/contents             any role   ?scope=direct|all
GET    /api/folders/:id/breadcrumb           any role
POST   /api/folders                          manager, superadmin
PATCH  /api/folders/:id                      manager, superadmin
DELETE /api/folders/:id                      manager, superadmin
```

`help_folders.parentId` is a self-reference (`null` = root), so nesting is
unlimited. Rules enforced server-side:

- **No cycles** — moving a folder into its own descendant returns `400`.
- **No duplicate sibling names** — `(tenant_id, parent_id, name)` is unique, and
  root-level clashes (which SQLite's index treats as distinct because of the
  `NULL`) are checked in the service. The same name in a *different* folder is
  fine.
- **Delete is non-destructive** — deleting a folder that still holds items
  returns `409` unless you pass `?moveItemsToRoot=true`. Items are never
  destroyed; orphaned items surface at the root. Child folders cascade.
- **Customers see only branches with published content.** The tree is pruned to
  folders containing at least one approved item, so pending-only branches are
  invisible rather than empty.
- **Re-filing is not an edit.** Moving an item between folders does *not* bump
  `contentVersion` or un-publish it, since its content is unchanged.

Create an item inside a folder with `folderId`; filter with
`GET /api/help?folderId=<uuid>`, or `folderId=root` for unfiled items.

All protected routes take `Authorization: Bearer <token>`.
Errors are always `{ "error": { "code", "message", "details?" } }`.

## Testing (Vitest + Supertest)

```bash
npm test                  # full suite, no server or database needed
npm run test:watch        # watch mode
```

Tests import the Express app directly (no port bound) and run against
**PGlite** — real PostgreSQL compiled to WASM, in-process. ENUMs, foreign
keys and transactions behave exactly as on Neon, with no network and no
cleanup. `TEST_DATABASE_URL` overrides the backend when set; the default
`pglite://memory` is what CI should use.

| File                   | Covers                                              |
| ---------------------- | --------------------------------------------------- |
| `setup-users.test.ts`  | one-time setup, forced rotation, provisioning, last-admin lock |
| `help.test.ts`         | approval workflow, un-publish-on-edit, audit trail, role boundaries |
| `folders.test.ts`      | nesting, duplicate names, cycles, delete safety, customer pruning |

Each file resets its database in `beforeAll` (see `test/setup.ts`), and
`test/helpers.ts` provisions role accounts idempotently per file.

## Database backends

`server/db/client.ts` is the only module that knows the engine. The scheme of
`DATABASE_URL` selects it:

```env
DATABASE_URL=postgresql://...   # Neon / any Postgres (production, dev)
DATABASE_URL=pglite://memory    # in-process Postgres (tests only)
```

Migrations are generated from the TypeScript schema and applied on boot:

```bash
npx drizzle-kit generate --name <change>
npm run db:migrate
```

One drizzle-kit quirk is documented in `server/db/schema/pg-enums.ts`: ENUM
types must be top-level exports, or the generator silently drops them.

## Notes / not yet built

- **Refresh tokens**: only short-lived access tokens are issued (8h). Add a
  refresh-token table before production.
- **File uploads**: the tree and file *records* are handled, but binary
  uploads are not. `media_assets` and `multer` are installed and unused — the
  upload route is the next piece. `contentUrl` currently expects an external
  URL for `image`/`video`/`pdf` items.
- **Frontend**: `App.tsx` still uses the mock login (accepts any password,
  stores it in plaintext `localStorage`). Wiring it to `POST /api/auth/login`
  — including the `mustChangePassword` forced-rotation screen — is the next step.
- **Rate limiting**: not applied — add `express-rate-limit` on `/api/auth/*`
  before exposing publicly.
- **Frontend**: `App.tsx` still uses the mock login (accepts any password,
  stores it in plaintext `localStorage`). Wiring it to these endpoints is the
  next step.
