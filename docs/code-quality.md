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

- Jest collects coverage per `jest.config.js`.
- `codecov.yml` sets **patch** coverage expectations (e.g. 80% target with threshold) and ignores test helpers/stories.
- Global Jest thresholds in `jest.config.js` are a baseline; raise them as the suite matures.

---

## CI overview

See `.github/workflows/ci.yml` for the exact job graph: lint, type-check, test with coverage, optional E2E/a11y/visual/Sonar, then web build. Keep this doc aligned when CI steps change.
