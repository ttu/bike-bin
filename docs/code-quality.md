# Bike Bin — Code Quality

> **Purpose:** Linting, formatting, git hooks, coverage gates, and how they tie into CI.  
> **Conventions:** [technical-specs.md](technical-specs.md) §9 and repo `AGENTS.md` / `CLAUDE.md`.

---

## Tools

| Tool            | Role                               | Config                                                                       |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| **ESLint**      | TypeScript + React + hooks rules   | `eslint.config.js`                                                           |
| **Prettier**    | Consistent formatting              | `.prettierrc` (and Prettier embedded in ESLint via `eslint-config-prettier`) |
| **TypeScript**  | Strict type checking               | `tsconfig.json` — `npm run type-check`                                       |
| **Husky**       | Git hooks                          | `prepare` script → `.husky/`                                                 |
| **lint-staged** | Staged files only on commit        | `package.json` `lint-staged`                                                 |
| **Codecov**     | Coverage reports and patch targets | `codecov.yml` + GitHub integration                                           |
| **SonarCloud**  | Static analysis (optional in CI)   | `.github/workflows/ci.yml`                                                   |

ESLint **ignores** include `node_modules`, `dist`, `.expo`, `coverage`, `.worktrees`.

---

## npm scripts

| Script                 | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run lint`         | ESLint on the repo                              |
| `npm run lint:fix`     | ESLint with `--fix`                             |
| `npm run format`       | Prettier write on `ts`, `tsx`, `json`, `md`     |
| `npm run format:check` | Prettier check (CI uses this)                   |
| `npm run type-check`   | `tsc --noEmit`                                  |
| `npm run validate`     | `format:check` + `lint` + `type-check` + `test` |

**Before merging:** run `validate` locally; CI runs overlapping checks plus `test:coverage` and a production **web export** (`expo export --platform web`) in the build job.

---

## Git hooks (Husky)

### Pre-commit (`.husky/pre-commit`)

The pre-commit hook runs **four checks** sequentially (all must pass):

1. **lint-staged** — ESLint with fix + Prettier on staged `*.ts`/`*.tsx`; Prettier on staged `*.json`/`*.md`.
2. **type-check** — `npm run type-check` (`tsc --noEmit`).
3. **test** — `npm test` (full Jest suite).
4. **build:web** — `npm run build:web` (`expo export --platform web`).

This is intentionally thorough — every commit is validated end-to-end.

### Pre-push (`.husky/pre-push`)

Checks that the current branch is rebased on the latest `origin/main` (skipped when pushing from `main` itself). Prevents pushing stale branches.

Do **not** bypass hooks with `--no-verify` — fix the underlying issue instead.

---

## Project conventions (summary)

- No `any` in TypeScript; prefer `undefined` over `null` where the codebase standard says so.
- **Branded IDs** for domain identifiers (`ItemId`, etc.).
- User-facing strings through **react-i18next** (`t(...)`), not hardcoded copy.
- **Theme tokens** for colors and spacing — avoid magic numbers in UI.
- **Business logic** in `utils/` or hooks, not buried in presentational components.
- **Commits:** Conventional style `type: description` (e.g. `feat:`, `fix:`, `test:`) — no scopes in commit messages per project rules.

---

## Coverage

- Jest collects coverage per `jest.config.js` (`src/` + `app/`, with documented exclusions).
- **`src/`** is gated at **65%** (branches, functions, lines, statements); **`app/`** uses separate minimums in the same config.
- `codecov.yml` sets **patch** coverage expectations (e.g. 80% target with threshold) and ignores test helpers/stories.

---

## CI overview

- **`.github/workflows/ci.yml`** — lint, type-check, test with coverage, optional E2E/a11y/visual/Sonar, web export smoke build (`expo export --platform web`), marketing site build. Runs on pushes and pull requests to `main`.
- **`.github/workflows/deploy-web.yml`** — after **CI** completes successfully on a **push to `main`**, exports the web app with production `EXPO_PUBLIC_*` secrets and runs **`eas deploy --prod`** to EAS Hosting. Requires `eas.json` (from `eas init`) and repository secrets; see [development.md](development.md) (Web production). Can also be triggered manually (**workflow_dispatch**).

Keep this doc aligned when CI steps change.

---

## TODO: Quality Gate Improvements

Additions and fixes needed to strengthen the CI pipeline. Remove items as they are implemented.

### High Priority

- [ ] **Visual regression tests** — current CI job is a placeholder (`echo`). Implement real Playwright screenshot comparison tests using the Playwright container image (`mcr.microsoft.com/playwright`), `RUN_VISUAL_TESTS=1` env flag, and artifact upload on failure. Reference: [emergency-supply-tracker CI](https://github.com/ttu/emergency-supply-tracker/blob/main/.github/workflows/ci.yml#L119).
- [ ] **Playwright E2E in CI** — 12 Playwright spec files exist in `e2e/` but CI only runs Maestro E2E. Add a Playwright E2E job using the Playwright container image targeting the web export.
- [ ] **RLS / database policy tests in CI** — `npm run test:rls` exists but is not in the CI pipeline. Add a job that runs Supabase locally (or uses test containers) and executes RLS tests.
- [ ] **i18n validation in CI** — `npm run validate:i18n` exists but is not in CI or the `validate` script. Add it to both.

### Medium Priority

- [ ] **Harden non-blocking jobs** — `a11y`, `e2e`, `visual`, and `sonarcloud` all use `continue-on-error: true`. Create a plan to promote each to blocking as they stabilize (remove `continue-on-error`).
- [ ] **Dependency security audit** — add `npm audit --audit-level=high` step to CI (or enable GitHub Dependabot / Renovate for automated PRs).
- [ ] **Bundle size tracking** — add a CI step that measures the web export size and fails if it exceeds a budget (e.g., using `size-limit` or a custom script comparing against a baseline).
- [ ] **Add `build:web` to `validate` script** — the pre-commit hook runs the web build, but `npm run validate` does not. Align them so CI and local validation match.

### Nice to Have

- [ ] **Storybook build/test in CI** — Storybook exists but has no CI job. Add a `storybook:build` step to catch component story breakage.
- [ ] **Mutation testing in CI** — `npm run test:mutation` (StrykerJS) exists locally. Consider a periodic (weekly/nightly) CI run to track mutation score trends.
- [ ] **Lighthouse / performance budget** — run Lighthouse CI against the web export to catch performance regressions (LCP, CLS, accessibility score).
