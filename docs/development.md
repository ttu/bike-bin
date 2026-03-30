# Bike Bin — Development Guide

> **Purpose:** How to run, debug, and work on the project locally.  
> **Source of truth:** `package.json`, `app.json` / `app.config.*`, repo root `README.md`.

---

## Prerequisites

- **Node.js** (v20 matches CI; v18+ generally works) and **npm**
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

## Common issues

- **Docker not running** — `db:start` fails until Docker is up.
- **Port conflicts** — Free 54321–54323 or run `npm run db:stop` before switching projects.
- **Signup disabled** — Local auth may require `enable_signup` in `supabase/config.toml`; see `db:enable-signup` / `dev:fresh` scripts.
