# Bike Bin — Deployments, environments, and version control

> **Purpose:** How **Git**, **Expo / EAS Hosting**, and **Supabase** line up for web builds and database deployments. For local setup and scripts, see [development.md](development.md).

---

## 1. Mental model

- **Expo web** is a **static export** (`expo export --platform web`). `EXPO_PUBLIC_*` variables are **fixed at build time**; they are not read from a server at runtime.
- **EAS Hosting** serves that static bundle. Each CI job chooses **which Supabase project** the app talks to by setting `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` during `npm run build:web`.
- **Supabase** applies **migrations** (and optional Edge Functions / storage from `config.toml`) to a **database**. That can happen via the **Supabase GitHub integration** (branching), via **CLI in CI**, or manually. The Expo app only sees the **API URL + anon key** you baked into the bundle — it does not “know” how the DB was deployed.

**Goal:** Keep **three** lines in parallel — same Git events drive both **where the web app points** and **which database is canonical** for that tier:

| Tier           | Git trigger    | Expo web (EAS)      | Supabase (schema / functions)              |
| -------------- | -------------- | ------------------- | ------------------------------------------ |
| **Preview**    | PR             | Preview URL         | Isolated preview DB per PR                 |
| **Staging**    | Push to `main` | Alias `staging`     | Staging DB (latest `main`, not live users) |
| **Production** | Tag `v*`       | `eas deploy --prod` | Production DB (releases only)              |

---

## 2. Version control and when things deploy

This repo uses **git worktrees** for feature work (see [CLAUDE.md](../CLAUDE.md)); **integration** still flows through **`main`** and **tags** for production web.

| Git event                        | Typical use            | Web (EAS Hosting)                                | Workflow file                   |
| -------------------------------- | ---------------------- | ------------------------------------------------ | ------------------------------- |
| **Branch + PR to `main`**        | Feature / fix review   | **Preview** — unique URL per deployment (PR job) | `ci.yml` → `deploy-web-preview` |
| **Push to `main`** (after merge) | Latest integrated code | **Staging** — stable alias `staging`             | `deploy-web-staging.yml`        |
| **Tag `v*`** (e.g. `v1.2.3`)     | Release                | **Production** — `eas deploy --prod`             | `deploy-web-production.yml`     |

**Production web release (example):**

```bash
git tag v1.2.3
git push origin v1.2.3
```

Tags should point at commits on `main` (or a release line you document). Native **App Store / Play** builds and submits are separate from this web pipeline unless you add more automation.

---

## 3. Expo environments (`EXPO_PUBLIC_ENV`)

Defined in `src/shared/utils/env.ts` as `AppEnv`, including `preview` for PR CI builds.

| Value         | When it is set               | Meaning                                                             |
| ------------- | ---------------------------- | ------------------------------------------------------------------- |
| `development` | Local dev (default if unset) | Local Supabase or personal `.env.local`                             |
| `preview`     | PR web export in CI          | Ephemeral EAS preview URL; shared or isolated backend (your choice) |
| `staging`     | `deploy-web-staging`         | Pre-production web on EAS **alias** `staging`                       |
| `production`  | `deploy-web-production`      | EAS **production** URL (`eas deploy --prod`)                        |

`EXPO_PUBLIC_ENV` is for app logic (feature flags, Sentry environment, UX). It does **not** switch the Supabase host by itself — **URL and anon key** do.

---

## 4. EAS Hosting URLs (Expo side)

One **EAS project** is enough. Hosting gives:

| Deployment     | How it is created            | URL pattern (conceptually)                        |
| -------------- | ---------------------------- | ------------------------------------------------- |
| **PR preview** | `eas deploy` (no `--prod`)   | Unique preview URL per deployment                 |
| **Staging**    | `eas deploy --alias staging` | Stable **alias** URL (e.g. `…--staging.expo.app`) |
| **Production** | `eas deploy --prod`          | Production hostname / custom domain               |

Details: [EAS Hosting — deployments and aliases](https://docs.expo.dev/eas/hosting/deployments-and-aliases/).

---

## 5. Supabase deployments and configuration

### 5.1 What the app needs (Expo)

For **client** builds, only:

- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Get them from **Supabase Dashboard** → the **branch or project** you target → **Project Settings** → **Data API** (API URL + `anon` key). Preview branches from **Supabase Branching** each have their **own** URL and keys (use those for PR preview web builds).

**Never** put the **service role** key in the Expo app or in `EXPO_PUBLIC_*`.

### 5.2 Current setup: one Supabase project + GitHub integration

A common configuration is **one** hosted project with **[Supabase GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration)** and **Branching** enabled:

- **Pull requests** → Supabase creates **preview branches** (ephemeral DBs). Migrations under `supabase/migrations/` run there; PR comments show status. **No production data** is copied to previews.
- **“Deploy to production”** (when enabled) → on push/merge to your chosen **production Git branch** (often `main`), Supabase applies migrations (and configured Edge Functions / storage) to the **host project’s production database**.

That pattern matches **“previews from PRs + production from every `main` commit.”** It does **not** match **“production Supabase only when you tag”** or **“staging Supabase on `main`.”** The gap is on the **Supabase** side: `main` is treated as production for the database even if Expo web uses a **staging** URL until tag.

### 5.3 Target Supabase layout (aligned with Expo)

| Tier           | Supabase shape                                    | How migrations / config ship                                  |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| **Preview**    | **Preview branch** per PR (branching)             | Automatic via GitHub integration when `supabase/**` changes   |
| **Staging**    | **Persistent branch** or **second cloud project** | Every push to `main` — _not_ the live prod DB                 |
| **Production** | **Host production** or **dedicated prod project** | Only on **release** (e.g. tag `v*`), not on every `main` push |

Ways to get there:

1. **Two cloud projects (clear split)**
   - **Staging project:** Link in CI; on **`push` to `main`**, run `supabase db push` (and deploy functions if you script it) against the staging project ref.
   - **Production project:** On **`push` tags `v*`**, run the same against the production ref.
   - Turn **off** “deploy to production on `main`” in the Supabase GitHub integration for the production project (or disconnect prod project from auto-deploy on `main`), so `main` no longer mutates prod.

2. **Branching only (single billing project)**
   - Use a **persistent Supabase branch** as **staging** (synced from `main`) and reserve **production** for the default / production branch.
   - Configure integration so **`main` does not auto-deploy to production** if the dashboard allows, or use a **release branch** Supabase treats as production and only fast-forward it on tag (more process-heavy).
   - Exact knobs depend on your Supabase plan and dashboard; see [Branching](https://supabase.com/docs/guides/deployment/branching) and [GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration).

3. **Previews today + CI for staging/prod**
   - Keep GitHub integration for **PR previews** only.
   - Add **GitHub Actions** that call the Supabase CLI with `SUPABASE_ACCESS_TOKEN` and the right **`--project-ref`** (or linked config) for staging on `main` and production on `v*`.

Until staging and production use **different** API URLs, keep **separate** GitHub secrets (or [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)) for `EXPO_PUBLIC_SUPABASE_*` per workflow so the **staging** web app does not talk to the **production** database.

### 5.4 Migrations

Schema truth lives in `supabase/migrations/`. **Preview** branches validate migrations on PRs. **Staging** should receive the same migrations as `main` before or with the staging web deploy. **Production** should receive migrations **only** when you cut a release (tag), or immediately before/after the production web deploy that points at prod — so app and schema stay compatible.

### 5.5 Wiring Expo PR previews to Supabase preview branches

PR preview web builds need the **preview branch’s** URL and anon key, not production’s.

- Supabase’s GitHub integration typically **comments on the PR** with deployment details; use that URL/key when configuring **per-PR** secrets or a small step that parses the comment (advanced).
- Simpler operational approach: **one shared preview project** or **manual** copy of preview credentials into a single `EXPO_PUBLIC_*` preview secret (all PRs share one preview DB) until you automate per-PR env injection.

Official references: [GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration), [Working with branches](https://supabase.com/docs/guides/deployment/branching/working-with-branches).

---

## 6. Matrix: Git → Expo + Supabase (target)

| Stage    | Expo workflow                                                      | EAS               | `EXPO_PUBLIC_ENV` | Supabase (target)                          | `EXPO_PUBLIC_*` should point at                                  |
| -------- | ------------------------------------------------------------------ | ----------------- | ----------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| PR       | `ci.yml` `deploy-web-preview`                                      | Preview URL       | `preview`         | Preview branch / preview DB                | That PR’s preview API URL + anon key (or shared preview project) |
| `main`   | `deploy-web-staging.yml`                                           | `--alias staging` | `staging`         | Staging DB (not prod)                      | **Staging** project or persistent staging branch                 |
| Tag `v*` | `deploy-web-production.yml` + **`deploy-supabase-production.yml`** | `--prod`          | `production`      | Production DB (`db push` + Edge Functions) | **Production** project / host prod                               |

**Today:** If the **Supabase GitHub integration** still deploys **production** on every `main` push, turn that off when using **`deploy-supabase-staging.yml`** / **`deploy-supabase-production.yml`** so prod is only updated on tags. Until staging and production use **different** API URLs, split **`EXPO_PUBLIC_*`** by workflow or GitHub Environment.

Deploy workflows use **[GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)** so **staging**, **production**, and **preview** each have their own **`EXPO_PUBLIC_*`** and **`SUPABASE_DB_PASSWORD`**. You can add **protection rules** on **production** (required reviewers, wait timer). Repository secrets are only for tokens shared across environments.

---

## 7. GitHub Actions configuration

Create three environments: **Settings → Environments** → add **`preview`**, **`staging`**, **`production`**.

### Repository secrets (shared)

| Secret                  | Used for                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `EXPO_TOKEN`            | [Expo access token](https://expo.dev/settings/access-tokens) — all `eas deploy` jobs                                     |
| `SUPABASE_ACCESS_TOKEN` | [Supabase account token](https://supabase.com/dashboard/account/tokens) — `supabase link`, `db push`, `functions deploy` |

### Per-environment variables and secrets

Use the **same names** in each environment; **values** differ (staging URL vs production URL, etc.).

| Name                            | Type              | Environments                       | Purpose                                                         |
| ------------------------------- | ----------------- | ---------------------------------- | --------------------------------------------------------------- |
| `SUPABASE_PROJECT_REF`          | **Variable**      | `staging`, `production`            | Supabase project ref from the dashboard URL (`…/project/<ref>`) |
| `SUPABASE_DB_PASSWORD`          | Secret (optional) | `staging`, `production`            | Postgres password if `link` / `db push` requires it             |
| `EXPO_PUBLIC_SUPABASE_URL`      | Secret            | `preview`, `staging`, `production` | API URL for that tier’s Supabase project                        |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Secret            | `preview`, `staging`, `production` | Anon / publishable key for that project                         |
| `EXPO_PUBLIC_SENTRY_DSN`        | Secret (optional) | `preview`, `staging`, `production` | Sentry DSN; omit if unused                                      |

**Jobs → environments:** `ci.yml` **`deploy-web-preview`** → **`preview`**; **`deploy-web-staging`** + **`deploy-supabase-staging`** → **`staging`**; **`deploy-web-production`** + **`deploy-supabase-production`** → **`production`**.

**Staging on `main`:** `.github/workflows/deploy-supabase-staging.yml` runs on **`push` to `main`** when `supabase/migrations/**` or `supabase/functions/**` changes (and **workflow_dispatch**): **`supabase db push`** + Edge Functions with **`--use-api`**.

**Production on tag:** `.github/workflows/deploy-supabase-production.yml` runs on **`push` of tags `v*`** (and **workflow_dispatch**): same against **production** environment.

Fork PRs do not run `deploy-web-preview` (no secrets exposure); same-repo PRs only.

If you also use the **Supabase GitHub integration** “deploy to production on `main`,” disable that for the same project or you may apply migrations twice. Prefer **either** the integration **or** this Action for `main`, not both to the same database.

---

## 8. Related files

| File                                               | Role                                               |
| -------------------------------------------------- | -------------------------------------------------- |
| `.github/workflows/ci.yml`                         | Lint/test/build; `deploy-web-preview`              |
| `.github/workflows/deploy-web-staging.yml`         | Staging after CI on `main`                         |
| `.github/workflows/deploy-web-production.yml`      | Production on tag `v*`                             |
| `.github/workflows/deploy-supabase-staging.yml`    | Staging: `db push` + Edge Functions on `main`      |
| `.github/workflows/deploy-supabase-production.yml` | Production: `db push` + Edge Functions on tag `v*` |
| `app.json` → `expo.web`                            | Metro, static export, favicon                      |
| `eas.json`                                         | EAS CLI / build profiles                           |
| `src/shared/api/supabase.ts`                       | Supabase client from `EXPO_PUBLIC_*`               |
| `src/shared/utils/env.ts`                          | `EXPO_PUBLIC_ENV` / `APP_ENV`                      |

**Edge Functions (staging + production workflows):** Each **immediate subfolder** of `supabase/functions/` is deployed if it has an **`index.ts`** or **`index.js`** entrypoint. Folders whose names start with **`_`** (e.g. `_shared` helpers) or **`.`** are skipped so they are never sent as standalone functions. Add a new function by adding a new folder with a standard entrypoint; no workflow edit is required.

**Workflow rename:** The file **`.github/workflows/deploy-web.yml`** was renamed to **`deploy-web-staging.yml`** (workflow display name **Deploy web staging**). Update any **bookmarked** Actions URLs, internal runbooks, or **scheduled** workflows that still pointed at the old file name.

---

## 9. Manual commands (local)

```bash
npm run build:web          # Static web export (uses local env)
npm run deploy:web         # Export + eas deploy (preview)
npm run deploy:web:prod    # Export + eas deploy --prod
```

For day-to-day dev setup, see [development.md](development.md).
