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
4. Run `npm install` in the worktree if needed

### Finishing a Feature

1. **Ensure main is up to date**: `git fetch origin && git checkout main && git pull`
2. **In the worktree**, rebase onto main: `git rebase main`
3. **Squash all commits into one**: `git reset --soft main && git commit -m "<conventional commit message>"`
4. **Cherry-pick to main**: from the main working directory, `git cherry-pick <commit-hash>`
5. **Clean up**: `git worktree remove .worktrees/<slug> && git branch -d <branch-name>`

### Important Rules

- **No PRs** — this project is in rapid development, cherry-pick directly to main
- **Single commit per feature** — always squash before cherry-picking
- **Never work directly on main** — always use a worktree
- The worktree directory name should match the branch slug (e.g., branch `feat/dark-mode` → `.worktrees/dark-mode/`)

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

**Commits:** `type: description` + optional bullet details. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `ci`. No scopes (use `feat:` not `feat(scope):`). **Never commit with `--no-verify`**; run pre-commit hooks (ESLint + Prettier on staged files) and fix failures instead of skipping.

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
npm run test                   # Jest unit + integration
npm run test:watch             # Jest watch
npm run test:coverage          # Jest coverage
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
