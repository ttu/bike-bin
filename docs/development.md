# Bike Bin — Development Guide

> **Purpose:** How to run, debug, and work on the project locally.  
> **Source of truth:** `package.json`, `app.json` / `app.config.*`, repo root `README.md`.

---

## Prerequisites

- **Node.js** v22 (matches GitHub Actions CI) and **npm**
- **Supabase CLI** — [Install](https://supabase.com/docs/guides/cli) (e.g. `brew install supabase/tap/supabase` on macOS)
- **Docker Desktop** — required for local Supabase (Postgres, Auth, Storage, etc.)

Expo is invoked via `npx` / project `node_modules` (`expo` in `package.json`); a global `expo-cli` is optional.

## Quick start

```bash
npm install
npm run dev              # Starts local Supabase, then Expo dev server
```

`npm run dev` runs `db:start` then `expo start`. If Supabase is already up, `supabase start` is effectively a no-op for an existing stack.

## Database scripts

| Script                     | Description                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run db:start`         | Start local Supabase (Postgres, Auth, Storage, Studio, …)                                   |
| `npm run db:stop`          | Stop Supabase containers                                                                    |
| `npm run db:reset`         | Recreate DB from `supabase/migrations`                                                      |
| `npm run db:seed`          | `db:reset` then image seed script (`scripts/seed-images.mjs`)                               |
| `npm run db:nuke`          | Harder reset: stop without backup, start, reset, seed images                                |
| `npm run db:status`        | Services, ports, API keys (for local env)                                                   |
| `npm run db:enable-signup` | Toggles `enable_signup` in `supabase/config.toml` (macOS `sed` — adjust on Linux if needed) |
| `npm run dev:fresh`        | Enables signup, nuke/reset/seed, then `expo start` — use when you need a clean slate        |

### Local Supabase ports (default)

| Service             | Port  |
| ------------------- | ----- |
| API (PostgREST)     | 54321 |
| Database (Postgres) | 54322 |
| Studio (UI)         | 54323 |

**Expo web:** Default Metro port is **8081**. Playwright E2E uses **8090** by default (`e2e/playwright-web-env.ts` + `RCT_METRO_PORT` in `playwright.config.ts`) so `npm run test:e2e` does not bind 8081 while `npm run dev` is running.

If you see **`EADDRINUSE :::8081`**, another Metro/Expo process is already listening (often a leftover dev server or a second terminal). Find it with `lsof -nP -iTCP:8081 -sTCP:LISTEN` and stop that process, or restart your machine’s stuck node.

Open **http://127.0.0.1:54323** for Supabase Studio after the stack is running.

## Dev server variants

```bash
npm run dev              # Supabase + Expo (default)
npm run dev:web          # Expo web only (no automatic db:start — start DB separately if needed)
npm run dev:android      # Expo Android
npm run dev:ios          # Expo iOS
npm run marketing:dev    # Astro — static marketing site (`sites/marketing/`)
```

## Validation and quality

```bash
npm run validate         # format:check + lint + type-check + test
npm test                 # Jest
npm run test:coverage    # Jest with coverage
npm run test:e2e         # Playwright (see e2e/)
npm run lint             # ESLint
npm run format:check     # Prettier check
```

CI also runs a **production web export** (`expo export --platform web`); run it locally when changing build-critical config:

```bash
npm run build:web
```

See [testing.md](testing.md) and [code-quality.md](code-quality.md) for coverage, hooks, and CI.

## Environment variables

The app reads these `EXPO_PUBLIC_*` variables (see `src/shared/api/supabase.ts` and `src/shared/utils/env.ts`):

| Variable                        | Purpose                              | Where to get it                    |
| ------------------------------- | ------------------------------------ | ---------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Local or remote Supabase API URL     | `npm run db:status` → API URL      |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) API key  | `npm run db:status` → anon key     |
| `EXPO_PUBLIC_SENTRY_DSN`        | Sentry DSN for error tracking        | Sentry project settings (optional) |
| `EXPO_PUBLIC_ENV`               | App environment (`development`, etc) | Defaults to `development` if unset |

Set these in an `.env` file at the project root or via your shell. Expo loads `EXPO_PUBLIC_*` vars automatically.

**Git worktrees:** Each worktree is its own root — copy or symlink `.env.local` from the primary clone into the worktree (see [CLAUDE.md](../CLAUDE.md) / [AGENTS.md](../AGENTS.md) bootstrap steps), then run `npm install` there.

## Web production (EAS Hosting)

The Expo web app is deployed to **[EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)** (static export, `expo.web.output`: `single` in `app.json`).

### One-time setup

1. **Link the app to an EAS project** (creates `eas.json` and may add `extra.eas` to `app.json`):
   - `npx eas-cli@latest login`
   - `npx eas-cli@latest init`
2. **Commit** `eas.json` and any `app.json` changes so CI can run `eas deploy`.
3. **GitHub repository secrets** (Settings → Secrets and variables → Actions):

   | Secret                          | Purpose                                                                              |
   | ------------------------------- | ------------------------------------------------------------------------------------ |
   | `EXPO_TOKEN`                    | Expo [access token](https://expo.dev/settings/access-tokens) — used by EAS CLI in CI |
   | `EXPO_PUBLIC_SUPABASE_URL`      | Production Supabase project URL                                                      |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase anon (public) key                                                |
   | `EXPO_PUBLIC_SENTRY_DSN`        | Optional — omit or leave empty if unused                                             |

### Manual deploy

```bash
npm run deploy:web:prod
```

Uses production build env from your machine (e.g. `.env.local`). For CI, the **Deploy web** workflow injects secrets as `EXPO_PUBLIC_*` during `npm run build:web`.

### Automated deploy (CI)

After the **CI** workflow succeeds on a **`push` to `main`**, **Deploy web** (`.github/workflows/deploy-web.yml`) exports the web bundle and runs `eas deploy --prod --non-interactive`. You can also run **Deploy web** manually from the Actions tab (**workflow_dispatch**).

## Common issues

- **Docker not running** — `db:start` fails until Docker is up.
- **Port conflicts** — Free default Supabase host ports (API **54321**, DB **54322**, Studio **54323**, Mailpit **54324**, analytics **54327**, pooler **54329**, edge inspector **8083**, etc.) or run `npm run db:stop`. For a **second** local stack without stopping the first, use `npm run test:rls:isolated` / `test:e2e:isolated`; the script shifts that full layout by a free `api` port (`BIKE_BIN_ISOLATED_API_PORT`, default `55421`; or shadow via `BIKE_BIN_ISOLATED_PORT_BASE`). See [testing.md](testing.md).
- **Signup disabled** — Local auth may require `enable_signup` in `supabase/config.toml`; see `db:enable-signup` / `dev:fresh` scripts.
