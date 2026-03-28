# Bike Bin — Testing Guide

> **Purpose:** How to run tests locally, where they live, and what the project expects for coverage and quality.  
> **Strategy & philosophy:** [technical-specs.md](technical-specs.md) §8.

---

## Commands (from `package.json`)

| Script                  | What it runs                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm test`              | Jest — unit and integration tests                               |
| `npm run test:watch`    | Jest in watch mode                                              |
| `npm run test:coverage` | Jest with coverage report                                       |
| `npm run test:rls`      | Jest — RLS integration tests against local Supabase (126 tests) |
| `npm run test:e2e`      | Playwright (`npx playwright test`) — specs under `e2e/`         |

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

### Current status (894 app tests + 126 RLS tests)

| Category                         | Tests | Share | Target | Status |
| -------------------------------- | ----: | ----: | -----: | ------ |
| Integration (components + hooks) |   478 |   62% |    70% | close  |
| Screen-level (near-E2E)          |    53 |    6% |    20% | low    |
| Unit (utils, mappers, pure fns)  |   237 |   30% |    10% | high   |
| **RLS (separate suite)**         |   126 |     — |      — | —      |

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

**Config:** `jest.rls.config.js` — separate from the main Jest config, 30s timeout per test.

**Location:** `src/test/__tests__/rls/` — one file per domain:

| Suite                        | What it covers                                            |
| ---------------------------- | --------------------------------------------------------- |
| `inventory.rls.test.ts`      | Items, photos, tags — owner vs. other user vs. anon       |
| `borrowing.rls.test.ts`      | Borrow requests — requester, owner, outsider access       |
| `messaging.rls.test.ts`      | Conversations, messages — participant vs. non-participant |
| `groups.rls.test.ts`         | Groups, memberships, group items — member vs. outsider    |
| `community.rls.test.ts`      | Profiles, ratings, notifications, locations               |
| `ownership.rls.test.ts`      | Cross-cutting ownership policies (bikes, parts)           |
| `infrastructure.rls.test.ts` | System tables (geocode_cache, etc.) — no user access      |

**How they work:**

1. `src/test/rls/setup.ts` creates real auth users via the Supabase admin API and signs them in to get JWTs.
2. Each test performs operations (SELECT, INSERT, UPDATE, DELETE) as different users and asserts that RLS policies allow or deny as expected.
3. `afterAll` cleans up created users.

**Adding new RLS tests:** When adding a new table or changing RLS policies, add corresponding test cases to the relevant suite file. Follow the existing pattern: create users, set up data as admin, then verify access as each role.

---

## E2E

**Playwright (web):** Specs live under `e2e/` (TypeScript). `npm run test:e2e` runs `npx playwright test`. Requires browser install per Playwright docs.

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

| File                    | Role                                  |
| ----------------------- | ------------------------------------- |
| `jest.config.js`        | Jest behavior and coverage            |
| `jest.rls.config.js`    | Jest config for RLS integration tests |
| `codecov.yml`           | Coverage gates for patches            |
| `src/test/setup.ts`     | Global test setup                     |
| `src/test/rls/setup.ts` | RLS test user creation and cleanup    |
| `e2e/`                  | Playwright E2E specs                  |
