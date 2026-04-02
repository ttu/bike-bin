# Bike Bin — Testing Guide

> **Purpose:** How to run tests locally, where they live, and what the project expects for coverage and quality.  
> **Strategy & philosophy:** [technical-specs.md](technical-specs.md) §8.

---

## Commands (from `package.json`)

| Script                      | What it runs                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                  | Same as `test:unit` (forwards extra args to Jest)                                                                                                                         |
| `npm run test:unit`         | Jest — unit and integration tests (RLS suite excluded)                                                                                                                    |
| `npm run test:watch`        | Jest in watch mode (unit + integration)                                                                                                                                   |
| `npm run test:coverage`     | Jest with coverage report (unit + integration)                                                                                                                            |
| `npm run test:rls`          | Jest — RLS integration tests against local Supabase (131 tests)                                                                                                           |
| `npm run test:e2e`          | Playwright (`npx playwright test`) — specs under `e2e/`                                                                                                                   |
| `npm run test:rls:isolated` | RLS suite via disposable worktree + fresh local Supabase (see below)                                                                                                      |
| `npm run test:e2e:isolated` | E2E in worktree; **8091** + `PLAYWRIGHT_ISOLATED=1`, `env … npm run test:e2e`, Expo **`--localhost`**, 120s webServer boot (works with Expo stopped in the primary clone) |
| `npm run test:db:isolated`  | RLS then E2E in one worktree                                                                                                                                              |

**Local gate before commit:** `npm run validate` runs `format:check`, `lint`, `type-check`, and `npm test` (see [code-quality.md](code-quality.md)).

---

## Jest configuration

- **Config file:** `jest.config.js` at the repo root.
- **Preset:** `jest-expo` for React Native / Expo compatibility.
- **Setup:** `src/test/setup.ts` (via `setupFilesAfterEnv`).
- **Ignored paths:** `node_modules`, `e2e/`, `.worktrees/` (see `testPathIgnorePatterns`).
- **Path alias:** `@/` → `src/` (matches app imports in tests).
- **Coverage collection:** `src/**/*.{ts,tsx}` with exclusions for stories, test files, barrel `index.ts`, and `src/test/**`.
- **Global thresholds (current):** 40% branches, functions, lines, statements — see `coverageThreshold` in `jest.config.js`. The product spec targets higher over time; **Codecov** patch rules may enforce stricter bars on PRs (see `codecov.yml`).

---

## Testing diamond (target mix)

Aim for roughly:

- **~70% integration** — React Native Testing Library: components, hooks, and providers together.
- **~20% E2E** — Critical flows (auth, inventory, borrow, messaging as they stabilize).
- **~10% unit** — Pure functions in `utils/` (validation, state transitions, formatting).

### Current status (894 app tests + 118 E2E tests + 131 RLS tests)

| Category                         | Tests | Share | Target | Status |
| -------------------------------- | ----: | ----: | -----: | ------ |
| Integration (components + hooks) |   478 |   62% |    70% | close  |
| Screen-level (near-E2E)          |    53 |    6% |    20% | low    |
| Unit (utils, mappers, pure fns)  |   237 |   30% |    10% | high   |
| **E2E (Playwright)**             |   118 |     — |      — | green  |
| **RLS (separate suite)**         |   131 |     — |      — | green  |

Unit tests are over-represented relative to the diamond target. The main gap is screen-level / E2E coverage — prioritize adding screen integration tests for critical flows (messaging, borrow, profile) and Playwright E2E specs to move toward the 70-20-10 split.

---

## Writing tests

- **Factories:** Prefer small builders or `@faker-js/faker` for realistic, maintainable data (seed reproducibility is useful for flaky failures).
- **Providers:** Use a shared `renderWithProviders` (or equivalent in `src/test/`) so screens see QueryClient, theme, i18n, and auth mocks consistent with production.
- **i18n:** Often tests assert on translation keys or stable `testID`s to avoid brittle copy changes.
- **Supabase:** Mock at the client or hook level for integration tests; use a real local Supabase for full-stack or E2E scenarios when needed. RLS tests use real Supabase (see below).

---

## RLS integration tests

Row-Level Security tests verify that Supabase RLS policies correctly restrict data access. They run against a **live local Supabase** instance — not mocks.

**Run:** `npm run test:rls` (requires `npm run db:start` first).

**Isolated run (recommended when your main clone already uses local Supabase):** `npm run test:rls:isolated` creates a throwaway git worktree under `.worktrees/`, copies `.env.local` from the repo root (or `.env` → `.env.local` in the worktree), then **finds the first free API port** (Kong/PostgREST URL port) such that the **whole Supabase local host layout** is free when shifted by `(apiPort − 54321)`: shadow DB `54320`, API `54321`, Postgres `54322`, Studio `54323`, Inbucket/Mailpit `54324`, analytics `54327`, pooler `54329`, edge inspector `8083` (see `scripts/patch-supabase-ports.mjs` and `supabase/config.toml`). That avoids collisions with a second stack that still holds `54324` / `54327` / `8083`. Start the scan with **`BIKE_BIN_ISOLATED_API_PORT`** (default `55421`), or legacy **`BIKE_BIN_ISOLATED_PORT_BASE`** as the **shadow** port (`api = base + 1`). The script increments `api` until every derived port is free. It patches `supabase/config.toml`, runs `npm ci`, **`supabase start`** (migrations + `seed.sql` on the new volume — no separate `db reset`), then **`scripts/merge-supabase-status-into-env-local.mjs`** (`API_URL`, `DB_URL`, keys into `.env.local` + shell exports). RLS tests still use the fixed local JWTs in `src/test/rls/setup.ts`. Same pattern for E2E: `npm run test:e2e:isolated`, or both: `npm run test:db:isolated`. Scripts: `scripts/run-isolated-db-tests.sh`, `scripts/patch-supabase-ports.mjs`, `scripts/merge-supabase-status-into-env-local.mjs` (`--dry-run` prints the worktree path and chosen ports).

**Config:** `jest.rls.config.js` — separate from the main Jest config, 30s timeout per test.

**Location:** `src/test/__tests__/rls/` — one file per domain:

| Suite                        | What it covers                                                  |
| ---------------------------- | --------------------------------------------------------------- |
| `inventory.rls.test.ts`      | Items, photos, tags — owner vs. other user vs. anon             |
| `borrowing.rls.test.ts`      | Borrow requests — SELECT/INSERT; UPDATE state machine (trigger) |
| `messaging.rls.test.ts`      | Conversations, messages — participant vs. non-participant       |
| `groups.rls.test.ts`         | Groups, memberships, group items — member vs. outsider          |
| `community.rls.test.ts`      | Profiles, ratings, notifications, locations                     |
| `ownership.rls.test.ts`      | Cross-cutting ownership policies (bikes, parts)                 |
| `infrastructure.rls.test.ts` | System tables (geocode_cache, etc.) — no user access            |

**How they work:**

1. `src/test/rls/setup.ts` creates real auth users via the Supabase admin API and signs them in to get JWTs.
2. Each test performs operations (SELECT, INSERT, UPDATE, DELETE) as different users and asserts that RLS policies allow or deny as expected.
3. `afterAll` cleans up created users.

**Adding new RLS tests:** When adding a new table or changing RLS policies, add corresponding test cases to the relevant suite file. Follow the existing pattern: create users, set up data as admin, then verify access as each role.

---

## E2E

**Playwright (web):** Specs live under `e2e/` (TypeScript). `npm run test:e2e` runs `npx playwright test`. The bundled Expo web server uses **port 8090** by default (`e2e/playwright-web-env.ts`); `playwright.config.ts` sets **`RCT_METRO_PORT`** so Metro does not fall back to **8081** (which would clash with `npm run dev`). Override with **`PLAYWRIGHT_WEB_PORT`** or **`PLAYWRIGHT_BASE_URL`**. Isolated E2E defaults to **8091** and **`PLAYWRIGHT_ISOLATED=1`** (`BIKE_BIN_ISOLATED_PLAYWRIGHT_PORT` to change the port). Requires browser install per Playwright docs. `e2e/global-setup.ts` re-seeds Postgres via `psql`; it uses **`BIKE_BIN_TEST_PG_URL`** from the environment, or reads that key from **`.env.local`**. Default DB URL is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. After changing local auth redirect URLs in `supabase/config.toml`, restart Supabase (`db:stop` / `db:start` or `db reset`). For a DB isolated from your dev Supabase, use `npm run test:e2e:isolated`.

**Maestro (mobile):** CI installs Maestro for mobile-flow testing. The CI `e2e` job runs `npm run test:e2e` (Playwright) after installing Maestro — both toolchains are available in the pipeline. See `.github/workflows/ci.yml` for the canonical setup.

---

## CI (GitHub Actions)

`.github/workflows/ci.yml` runs, among others:

- **lint** — `format:check`, `lint`
- **type-check** — `tsc --noEmit`
- **test** — `test:coverage` + Codecov upload
- **build** — `expo export --platform web`
- Optional / non-blocking jobs may include a11y, E2E, SonarCloud, visual placeholders

If a script is referenced in CI but not in `package.json`, add the script locally so developers can reproduce CI steps.

---

## Related files

| File                                               | Role                                                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `jest.config.js`                                   | Jest behavior and coverage                                                                                     |
| `jest.rls.config.js`                               | Jest config for RLS integration tests                                                                          |
| `codecov.yml`                                      | Coverage gates for patches                                                                                     |
| `src/test/setup.ts`                                | Global test setup                                                                                              |
| `src/test/rls/setup.ts`                            | RLS test user creation and cleanup                                                                             |
| `scripts/run-isolated-db-tests.sh`                 | Disposable worktree + dynamic-port Supabase for RLS/E2E                                                        |
| `scripts/patch-supabase-ports.mjs`                 | Rewrites api/db/studio/shadow ports in `config.toml`                                                           |
| `scripts/merge-supabase-status-into-env-local.mjs` | After `supabase start`, writes `EXPO_PUBLIC_SUPABASE_URL` + anon/publishable key from `supabase status -o env` |
| `e2e/`                                             | Playwright E2E specs                                                                                           |
