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

**Git worktrees:** Each worktree is its own root — copy or symlink `.env.local` from the primary clone into the worktree (see [CLAUDE.md](../CLAUDE.md) / [AGENTS.md](../AGENTS.md) bootstrap steps), then run `npm install` there. When you finish a branch, push with **`git push -u origin <branch>`** (or **`git branch -u origin/<branch>`** if the remote already exists) so your editor shows a proper upstream; then open a **PR** to `main` — see the worktree “Finishing a Feature” section in those files.

## Web production (EAS Hosting)

The Expo web app is deployed to **[EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)** (static export, `expo.web.output`: `single` in `app.json`). For how **Git branches, tags, EAS URLs, and Supabase projects** fit together, see **[deployments.md](deployments.md)**.

### One-time setup

1. **Link the app to an EAS project** (creates `eas.json` and may add `extra.eas` to `app.json`):
   - `npx eas-cli@latest login`
   - `npx eas-cli@latest init`
2. **Commit** `eas.json` and any `app.json` changes so CI can run `eas deploy`.
3. **GitHub** — see [deployments.md](deployments.md) §7 for the full list. In short:
   - **Repository → Settings → Environments:** create **`preview`**, **`staging`**, **`production`**.
   - In **each** environment, add secrets **`EXPO_PUBLIC_SUPABASE_URL`**, **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** (and optional **`EXPO_PUBLIC_SENTRY_DSN`**) with values for **that** Supabase project.
   - In **`staging`** and **`production`**, add variable **`SUPABASE_PROJECT_REF`** and optional secret **`SUPABASE_DB_PASSWORD`** for Supabase CLI deploys.
   - **Repository → Secrets and variables → Actions → Secrets:** **`EXPO_TOKEN`**, **`SUPABASE_ACCESS_TOKEN`** (shared by all deploy jobs).

### Manual deploy

```bash
npm run deploy:web:prod
```

Uses production build env from your machine (e.g. `.env.local`). For CI, workflows inject secrets as `EXPO_PUBLIC_*` during `npm run build:web`.

### Automated deploy (CI)

- **Pull requests** to `main`: the **CI** workflow runs **`deploy-web-preview`** after the **`build`** job succeeds (every push to the PR, including new commits). Same-repo branches only — `eas deploy --non-interactive` with `EXPO_PUBLIC_ENV=preview`. Fork PRs skip this job (no deploy).
- **Push to `main`**: **Deploy web staging** (`.github/workflows/deploy-web-staging.yml`) runs after the **CI** workflow completes successfully — `eas deploy --alias staging --non-interactive` and `EXPO_PUBLIC_ENV=staging`.

- **Version tags** (`v*`, e.g. `v1.2.3`): **Deploy web production** (`.github/workflows/deploy-web-production.yml`) runs on the tag push — `eas deploy --prod --non-interactive` and `EXPO_PUBLIC_ENV=production`.

You can also run **Deploy web staging** manually from the Actions tab (**workflow_dispatch** on `main`).

### Supabase staging (migrations + Edge Functions on `main`)

When **`supabase/migrations/**`or`supabase/functions/**`** changes on **`main`**, **Deploy Supabase staging** (`.github/workflows/deploy-supabase-staging.yml`) runs **`supabase db push`** and deploys all Edge Functions under `supabase/functions/`. The job uses GitHub Environment **`staging`** (`SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`) plus repository **`SUPABASE_ACCESS_TOKEN`**.

### Supabase production (migrations + Edge Functions on release tag)

Production database and Edge Functions should track **released** code, not every `main` commit. After merging to `main` and verifying staging, cut a **version tag** (same pattern as web production):

```bash
git fetch origin && git checkout main && git pull
git tag v1.2.3   # use your version
git push origin v1.2.3
```

Pushing tag **`v*`** runs **Deploy Supabase production** (`.github/workflows/deploy-supabase-production.yml`): **`supabase db push`** and the same Edge Function set as staging, against the **production** project. The job uses GitHub Environment **`production`** (`SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`) plus repository **`SUPABASE_ACCESS_TOKEN`**.

You can also run **Deploy Supabase production** from the Actions tab (**workflow_dispatch**) — pick the branch or tag that should be deployed.

**Manual alternative (local):** with the CLI logged in and linked to the prod project, from repo root:

```bash
supabase link --project-ref <production-ref>
supabase db push
supabase functions deploy <name> --use-api   # repeat per function, or use CI
```

**Order with web:** Push the **`v*`** tag once; **Deploy web production** and **Deploy Supabase production** both trigger on that tag. Ensure the **`production`** environment’s **`EXPO_PUBLIC_*`** secrets match the production Supabase URL and anon key so the shipped web app talks to the DB you just migrated.

Details: [deployments.md](deployments.md).

## Marketing site (GitHub Pages)

The Astro marketing site (`sites/marketing/`) deploys to **[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)** via **Deploy marketing site (GitHub Pages)** (`.github/workflows/deploy-marketing-pages.yml`).

Built CSS and JS are emitted under `/astro/` (`build.assets` in `astro.config.mjs`), not Astro’s default `/_astro/`, because GitHub Pages’ **Jekyll** integration does not publish paths that start with `_`, so default Astro assets 404 on Pages.

### One-time setup

1. **Repository → Settings → Pages** — under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
2. Merge a change under `sites/marketing/` to `main`, or run the workflow manually (**Actions** → **Deploy marketing site (GitHub Pages)** → **Run workflow**).
3. **Custom domain `bikebin.app`:** DNS should point to GitHub Pages ([docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)). The repo includes `sites/marketing/public/CNAME` so the built site publishes the hostname; finish configuration in **Pages** → **Custom domain** if needed.

### Required repository variables (deploy workflow)

**Deploy marketing site (GitHub Pages)** fails fast if either variable is missing. Set both under **Settings → Secrets and variables → Actions → Repository variables**:

| Variable              | Purpose                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MARKETING_SITE_URL`  | Passed to `ASTRO_SITE_URL` — canonical host for Astro (`site`), sitemap, and meta URLs.                                                                                     |
| `MARKETING_BASE_PATH` | Passed to `ASTRO_BASE_PATH` — must match how Pages serves the site root (`/` for a custom domain at the apex or `www`; `/<repo>/` for `https://<owner>.github.io/<repo>/`). |

Examples:

| Where the site is served                                                                           | `MARKETING_SITE_URL`                               | `MARKETING_BASE_PATH` |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------- |
| Custom domain at site root (e.g. `https://bikebin.app/` or `https://www.bikebin.app/`)             | `https://bikebin.app` or `https://www.bikebin.app` | `/`                   |
| GitHub Pages project URL (e.g. [https://ttu.github.io/bike-bin/](https://ttu.github.io/bike-bin/)) | `https://ttu.github.io`                            | `/bike-bin/`          |

Switching hosts is only a matter of updating these two values (and DNS / **Pages → Custom domain** / `public/CNAME` as needed). **CI** still builds the marketing site without these variables — `sites/marketing/astro.config.mjs` uses local defaults when `ASTRO_*` is unset.

## Common issues

- **Docker not running** — `db:start` fails until Docker is up.
- **Port conflicts** — Free default Supabase host ports (API **54321**, DB **54322**, Studio **54323**, Mailpit **54324**, analytics **54327**, pooler **54329**, edge inspector **8083**, etc.) or run `npm run db:stop`. For a **second** local stack without stopping the first, use `npm run test:rls:isolated` / `test:e2e:isolated`; the script shifts that full layout by a free `api` port (`BIKE_BIN_ISOLATED_API_PORT`, default `55421`; or shadow via `BIKE_BIN_ISOLATED_PORT_BASE`). See [testing.md](testing.md).
- **Signup disabled** — Local auth may require `enable_signup` in `supabase/config.toml`; see `db:enable-signup` / `dev:fresh` scripts.
