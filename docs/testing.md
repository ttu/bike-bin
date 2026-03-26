# Bike Bin — Testing Guide

> **Purpose:** How to run tests locally, where they live, and what the project expects for coverage and quality.  
> **Strategy & philosophy:** [technical-specs.md](technical-specs.md) §8.

---

## Commands (from `package.json`)

| Script                  | What it runs                                            |
| ----------------------- | ------------------------------------------------------- |
| `npm test`              | Jest — unit and integration tests                       |
| `npm run test:watch`    | Jest in watch mode                                      |
| `npm run test:coverage` | Jest with coverage report                               |
| `npm run test:e2e`      | Playwright (`npx playwright test`) — specs under `e2e/` |

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

---

## Writing tests

- **Factories:** Prefer small builders or `@faker-js/faker` for realistic, maintainable data (seed reproducibility is useful for flaky failures).
- **Providers:** Use a shared `renderWithProviders` (or equivalent in `src/test/`) so screens see QueryClient, theme, i18n, and auth mocks consistent with production.
- **i18n:** Often tests assert on translation keys or stable `testID`s to avoid brittle copy changes.
- **Supabase:** Mock at the client or hook level for integration tests; use a real local Supabase for full-stack or E2E scenarios when needed.

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

| File                | Role                       |
| ------------------- | -------------------------- |
| `jest.config.js`    | Jest behavior and coverage |
| `codecov.yml`       | Coverage gates for patches |
| `src/test/setup.ts` | Global test setup          |
| `e2e/`              | Playwright E2E specs       |
