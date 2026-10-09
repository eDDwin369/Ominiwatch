# Help Management (ported feature)

The Help Management feature from the standalone `help-manage` app is ported into
this shell. It is **not** an iframe/micro-frontend — the components render natively
in the app's React tree.

## Layout

| Path | What it is |
| --- | --- |
| `src/help-app/` | The ported help app (components, pages, store, styles). Isolated namespace so it can't collide with the shell's `src/`. |
| `src/help-app/help.css` | Tailwind for the help UI only. Imported without a cascade layer so its utilities beat the shell's unlayered resets, and its tokens/reset are scoped to `.help-scope`. |
| `src/help-app/lib/router-shim.tsx` | Bridges the help app's TanStack Router hooks (`useNavigate`/`useRouterState`) onto the shell's hash router. Aliased as `@tanstack/react-router`. |
| `api/` | The Help Management API service (Express + Postgres/Drizzle: help, folders, media, chat). Self-contained. |
| `public/help`, `public/images` | Static assets used by the help UI. |

Aliases are declared in `vite.config.ts` and `tsconfig.app.json`:
`@help` → `src/help-app`, `@tanstack/react-router` → the shim.

## Shell integration

- `src/components/Dashboard/Sidebar.tsx` — nav items matching the help app
  (Customer / User / Tickets / Help Admin / Superadmin, gated by role).
- `src/utils/navigation.ts` — session role (`AppRole`) + `roleFromEmail` used by
  the mock login.
- `src/components/Dashboard/Dashboard.tsx` — renders the ported pages per view:
  `customer`, `user`, `tickets`, `admin`, plus the help "Site Recordings"
  dashboard on `overview` after the welcome is seen once.
- `src/help-app/HelpFeatureMount.tsx` — mounts the global help surface (panel,
  right-click popup, overlays) and exposes the per-view wrappers.

## Running locally

```bash
# 1. API service (needs api/.env — see api/.env.example)
cd api && npm install && npm run dev      # listens on :3100

# 2. Shell
npm install && npm run dev                # http://localhost:5173
```

The shell proxies `/api` → `http://localhost:3100` in dev (`vite.config.ts`) and
nginx proxies it in production (`nginx.conf`).

### API token

The API issues no tokens; it verifies them against `JWT_SECRET`. Put a token in
`.env`:

```
VITE_HELP_API_URL=
VITE_HELP_API_TOKEN=<minted token>
```

Without a token the help UI runs in **local-only** mode (folders, uploads and
approvals stay in `localStorage`). With a token, folders/uploads/approvals
persist to the database.

## Demo roles (mock login — any password)

| Email | Role |
| --- | --- |
| `customer@oomnieye.com` | customer |
| `subadmin@oomnieye.com` | Help Admin (`sub_admin`) |
| `admin@oomnieye.com` | Superadmin (`admin`) |

## Limitations / follow-ups

- The `dark:` variant is bound to a `.dark` class (never set), so the help UI
  stays light regardless of OS preference.
- `api/` ships a build output folder convention but the app runs the service
  separately; wiring it into the single Docker image is a follow-up.
- Unused-locals linting is off project-wide because the vendored help app shipped
  with it off; tightening it is tracked as a follow-up.
