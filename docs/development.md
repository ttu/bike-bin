# Bike Bin — Development Guide

> **Purpose:** How to run, debug, and work on the project locally.
> **Source of truth:** `package.json`, `app.json` / `app.config.*`, README in repo root.

---

## Prerequisites

- **Node.js** (v18+) and **npm**
- **Expo CLI** — `npm install -g expo-cli`
- **Supabase CLI** — `brew install supabase/tap/supabase`
- **Docker Desktop** — required by Supabase CLI to run local services

## Quick Start

```bash
npm install
npm run dev              # Starts Supabase + Expo dev server
```

`npm run dev` ensures local Supabase is running before launching Expo. If Supabase is already running, it continues without error.

## Database Scripts

| Script              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `npm run db:start`  | Start local Supabase (Postgres, Auth, Storage, Studio) |
| `npm run db:stop`   | Stop all Supabase containers                           |
| `npm run db:reset`  | Drop and re-run all migrations from scratch            |
| `npm run db:status` | Show running services, ports, and API keys             |

### Local Supabase Ports

| Service             | Port  |
| ------------------- | ----- |
| API (PostgREST)     | 54321 |
| Database (Postgres) | 54322 |
| Studio (UI)         | 54323 |

After `npm run db:start`, visit **http://127.0.0.1:54323** for the database Studio UI.

## Dev Server Variants

```bash
npm run dev              # Supabase + Expo (default)
npm run dev:web          # Expo web only
npm run dev:android      # Expo Android only
npm run dev:ios          # Expo iOS only
```

## Validation

```bash
npm run validate         # format + lint + type-check + test
npm test                 # Jest unit + integration tests
npm run test:e2e         # Playwright E2E tests
npm run lint             # ESLint
npm run format:check     # Prettier check
```

## Common Issues

- **Docker not running** — `db:start` will fail. Start Docker Desktop first.
- **Port conflicts** — If ports 54321-54323 are in use, stop the conflicting service or run `npm run db:stop` to clean up a previous session.
