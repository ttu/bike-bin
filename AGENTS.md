# Bike Bin

## Project Context

**Bike Bin** – Peer-to-peer bike parts exchange app (iOS, Android, Web). Expo + React Native + TypeScript, Supabase (Auth, PostgREST, Realtime, Storage, Edge Functions), PostgreSQL + PostGIS, TanStack Query, React Native Paper (MD3), react-i18next, Expo Router. Feature slices, anemic domain models, incremental visual-first development. Reference: [docs/functional-specs.md](docs/functional-specs.md), [docs/technical-specs.md](docs/technical-specs.md), [docs/system-architecture.md](docs/system-architecture.md), [docs/security.md](docs/security.md), [docs/feature-design.md](docs/feature-design.md).

---

## Worktree-Based Feature Development

**All new features and changes MUST use a git worktree.** This is non-negotiable.

### Starting a Feature

1. **Create a branch** from `main`: `git branch <branch-name> main`
   - Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `refactor/<slug>`
2. **Create a worktree** in `.worktrees/`: `git worktree add .worktrees/<slug> <branch-name>`
3. **Work entirely within the worktree** — all file edits, tests, etc. happen inside `.worktrees/<slug>/`
4. **Copy env files from the primary clone** into the worktree root — `.env.local` is gitignored (and `.env` if you use it), so a new worktree has no `EXPO_PUBLIC_*` values until you copy or symlink. From `.worktrees/<slug>/`: `cp ../../.env.local .env.local` (and `cp ../../.env .env` if present), or `ln -sf ../../.env.local .env.local` to share the primary clone’s file.
5. **Run `npm install`** in the worktree — required every time; each checkout has its own `node_modules` (Expo/Metro will not resolve `expo-router/entry` etc. without it).

### Finishing a Feature

1. **Ensure main is up to date** (from the primary clone): `git fetch origin && git checkout main && git pull`
2. **In the worktree:** `git checkout <branch-name>` then `git rebase main`
3. **Squash all commits into one:** `git reset --soft main && git commit -m "<conventional commit message>"`
4. **Push and set upstream** (from the worktree): `git push -u origin <branch-name>` on first push. **Always** keep the branch tracking the remote: `git branch -vv` should list `[origin/<branch-name>]` next to your branch. If the remote branch already exists but yours has no upstream (common when switching clones or worktrees), run `git branch -u origin/<branch-name>` — do **not** treat Cursor or VS Code **Publish Branch** as “commits are missing on GitHub”; it only means **no upstream is configured** for the current local branch, which is confusing when `origin/<branch>` already exists and matches.
5. **Open a pull request** to `main`. Integration happens on GitHub after CI/review; do not leave finished work only on a local branch.
6. **After the PR is merged:** From the primary clone: `git fetch origin && git checkout main && git pull`, then `git worktree remove .worktrees/<slug>` and `git branch -d <branch-name>`.

### Important Rules

- **Pull requests** — when work in the worktree is complete, push (with upstream set) and open a PR to `main`
- **Single commit per feature** — squash before opening the PR (or use one commit on the PR branch)
- **Never work directly on main** — always use a worktree
- The worktree directory name should match the branch slug (e.g., branch `feat/dark-mode` → `.worktrees/dark-mode/`)
- **Bootstrap checklist** — after `git worktree add`, always copy/link env from the primary clone **and** run `npm install` before running the app or tests in that worktree

---

## Quality Rules

- No `any` in TypeScript — strict mode enforced
- No hardcoded strings — all user-facing text via `t()` from react-i18next
- No hardcoded colors or font sizes — use theme tokens
- No business logic in components — extract to `utils/`
- No inline styles — use `StyleSheet.create`
- All text via Paper `<Text variant="...">`
- Server state via TanStack Query, client state via React Context — never mix
- Every new feature or bug fix must include a test
- Prefer `undefined` over `null`
- Use branded types for IDs (`ItemId`, `UserId`)

---

## Conventions

- **Naming:** Feature components in `src/features/[feature]/components/`; shared in `src/shared/components/`. Hooks in `features/…/hooks/`. Utils camelCase in `features/…/utils/` or `shared/utils/`.
- **Structure:** Feature slice: `components/` (Component.tsx, .stories.tsx, .test.tsx), `hooks/`, `utils/`, `types.ts`, `context.ts`, `provider.tsx`, `index.ts` (public API). Shared: components, hooks, utils, types, api, i18n.
- **Tests:** Unit `[function].test.ts`, component `[Component].test.tsx`, E2E `e2e/[feature].spec.ts` (Playwright). Testing Diamond: 70% integration, 20% E2E, 10% unit.
- **i18n keys:** `namespace.section.key` (e.g. `inventory.status.loaned`). One JSON file per feature namespace + `common.json` for shared strings.
- **Imports:** Features import from `shared/` and own slice only. No cross-feature internal imports. Use `index.ts` public API.

---

## Version Control

**Commits:** conventional `type: description`; optional body (bullets, `Refs: #issue`). **No scopes** — use `feat:` not `feat(scope):`.

**Types:** `feat` (new features), `fix` (bug fixes), `refactor` (refactor without intended behavior change), `test` (tests), `docs` (documentation), `style` (formatting/style only), `chore` (deps, tooling, misc), `ci` (CI/CD), `build` (build/bundler), `perf` (performance).

**Never commit with `--no-verify`**; run pre-commit hooks and fix failures instead of skipping.

---

## Commands

**Always use `npm run` scripts.** Never run tools directly via `npx` (e.g. `npx eslint`, `npx jest`, `npx tsc`) unless there is no npm script available.

```bash
npm run dev                    # Supabase + Expo dev server
npm run db:start               # Start local Supabase
npm run db:stop                # Stop local Supabase
npm run db:reset               # Re-run all migrations
npm run db:status              # Show services, ports, keys
npm run lint                   # ESLint
npm run lint:fix               # ESLint fix
npm run format                 # Prettier write
npm run format:check           # Prettier check
npm run test                   # Same as test:unit (forwards extra Jest args)
npm run test:unit              # Jest unit + integration (excludes RLS; see jest.config.js)
npm run test:watch             # Jest watch (unit + integration)
npm run test:coverage          # Jest coverage (unit + integration)
npm run test:rls               # RLS integration tests (needs local Supabase)
npm run test:e2e               # Playwright E2E
npm run test:a11y              # Accessibility tests
npm run test:mutation          # StrykerJS mutation (local only)
npm run validate               # format + lint + type-check + test + build
npm run validate:i18n          # Check missing/unused translation keys
npm run storybook              # React Native Storybook
```

**Before commit:** `npm run validate` (format + lint + type-check + test + build).

---

## Documentation

| Doc                                                        | Purpose                                           |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [docs/functional-specs.md](docs/functional-specs.md)       | Product scope, features, user flows               |
| [docs/technical-specs.md](docs/technical-specs.md)         | Tech stack, patterns, testing, code quality       |
| [docs/system-architecture.md](docs/system-architecture.md) | System design, feature slices, data flow          |
| [docs/security.md](docs/security.md)                       | Auth, RLS, privacy, GDPR                          |
| [docs/feature-design.md](docs/feature-design.md)           | Design decisions, screen-level UX specs           |
| [docs/specs/README.md](docs/specs/README.md)               | Per-topic feature design specs index              |
| [docs/description.md](docs/description.md)                 | App description (update with implementation)      |
| [docs/development.md](docs/development.md)                 | Dev setup, run, debug                             |
| [docs/architecture.md](docs/architecture.md)               | Current architecture (update with implementation) |
| [docs/datamodel.md](docs/datamodel.md)                     | Entities, types, Supabase schema                  |
| [docs/testing.md](docs/testing.md)                         | How to run and write tests                        |
| [docs/code-quality.md](docs/code-quality.md)               | ESLint, Prettier, hooks, CI                       |

When implementing or changing features, update the matching doc.
