# AI Agents & Workflows

Guide for AI-assisted development on Bike Bin. All relevant info below; see `docs/` for full specs.

---

## Project Context

**Bike Bin** – Peer-to-peer bike parts exchange app (iOS, Android, Web). Expo + React Native + TypeScript, Supabase (Auth, PostgREST, Realtime, Storage, Edge Functions), PostgreSQL + PostGIS, TanStack Query, React Native Paper (MD3), react-i18next, Expo Router. Feature slices, anemic domain models, incremental visual-first development. Reference: [docs/plans/functional-specs.md](docs/plans/functional-specs.md), [docs/plans/technical-specs.md](docs/plans/technical-specs.md), [docs/plans/architecture.md](docs/plans/architecture.md), [docs/plans/security.md](docs/plans/security.md), [docs/plans/2026-03-17-feature-design.md](docs/plans/2026-03-17-feature-design.md).

---

## Common Workflows

**1. New component** – Feature in `src/features/[feature]/components/` or shared in `src/shared/components/`. TypeScript props, Storybook stories, integration tests (React Native Testing Library), theme tokens only. Copy-paste example:

```text
Create a new ItemCard component following our architecture:
- Feature in src/features/inventory/components/ OR shared in src/shared/components/
- Full TypeScript props (e.g. item: InventoryItem, onPress?, compact?)
- Storybook stories with all states
- Integration tests, StyleSheet.create (no inline styles)
- Use Paper <Text variant="..."> and theme tokens for colors
Component should: [one line]. Props: [list]. States in Storybook: [list]
```

**2. Business logic** – Pure utils in `features/*/utils/` or `shared/utils/`, full types, unit tests (100% for logic). Reference docs/datamodel.md. Example prompt: "Implement calculateItemStatus in src/features/inventory/utils/status.ts: inputs Item + BorrowRequest[]; determine current status from item state and active requests; return ItemStatus enum. Unit tests + edge cases."

**3. E2E** – Maestro in `e2e/[feature].yaml`. Test critical user flows. Example:

```text
Create Maestro E2E tests for [feature]:
- Test file: e2e/[feature].yaml
- Test both happy path and error cases
User flows to test: 1. … 2. … 3. …
Reference: docs/plans/technical-specs.md §8
```

**4. i18n** – Update `src/i18n/en/[namespace].json` (and other locales); use `useTranslation('[namespace]')` in component. Keys: `section.key` (e.g. `inventory.addItem`). Example: "Add translations for [Component]: update en [namespace].json, use useTranslation. Texts: [list]. Context: [where shown]."

**5. Refactor** – Requirements: keep behavior and coverage; update Storybook/types; run tests. Describe current issues and goal. Template: "Refactor [component/module] to: [goal]. Requirements: maintain functionality, keep/improve coverage, update Storybook/types, run tests. Current issues: [list]."

**6. Debug** – Provide: current vs expected behavior, steps to reproduce, relevant files, error message. Template:

```text
Debug issue: [Brief description]
Current behavior: [What's happening]
Expected behavior: [What should happen]
Steps to reproduce: 1. … 2. …
Relevant files: [File 1], [File 2]
Error message (if any): [Error text]
```

---

## Code Review Checklist

When asking AI to review code, use:

```text
Review the following code for:
✓ TypeScript types correct and complete (strict mode, no any)
✓ Component architecture (presentational vs container, feature slices)
✓ Test coverage (integration tests preferred)
✓ Accessible (WCAG 2.1 Level AA), responsive
✓ i18n - no hardcoded strings, all via t()
✓ Theme tokens - no hardcoded colors or font sizes
✓ Server state via TanStack Query, client state via Context
✓ No business logic in components (utils only)
✓ Storybook for presentational components
✓ Error handling and loading states

Code:
[Paste code here]
```

---

## Conventions

- **Naming:** Feature components (e.g. ItemCard, BikeDetail) in `src/features/[feature]/components/`; shared (Button, EmptyState) in `src/shared/components/`. Hooks `useInventory`, `useNearbyListings` in `features/…/hooks/`. Utils camelCase in `features/…/utils/` or `shared/utils/`.
- **Structure:** Feature slice: `components/` (Component.tsx, .stories.tsx, .test.tsx), `hooks/`, `utils/`, `types.ts`, `context.ts`, `provider.tsx`, `index.ts` (public API). Shared: components, hooks, utils, types, api, i18n.
- **Tests:** Unit `[function].test.ts`, component `[Component].test.tsx`, E2E `[feature].yaml` (Maestro). Every new feature or bug fix must include a corresponding test if one doesn't already exist.
- **i18n keys:** `namespace.section.key` (e.g. `inventory.status.loaned`). One JSON file per feature namespace + `common.json` for shared strings.
- **TypeScript:** Strict mode. No `any`. Prefer `undefined` over `null`. Use branded types for IDs (`ItemId`, `UserId`).
- **Styling:** `StyleSheet.create` only. All colors from theme tokens. All text via Paper `<Text variant="...">`. No inline styles.
- **State:** TanStack Query for server state (Supabase data). React Context for client-only state (auth, UI). Never mix.
- **Imports:** Features import from `shared/` and own slice only. No cross-feature internal imports. Use `index.ts` public API.

---

## Collaboration

**Tips:** (1) Provide context – which feature slice you're working on. (2) Reference specs – point to functional-specs.md, architecture.md, etc. (3) Show examples – "Similar to ItemCard, create…". (4) Be specific about tests – e.g. "Write integration tests that verify the component displays items grouped by status", not just "add tests". (5) Iterate incrementally – component → hook → integration test → E2E.

**Don't ask for:** Entire app in one go; heavy state libs like Redux (use TanStack Query + Context); CSS-in-JS/Tailwind (use StyleSheet + Paper); unit tests for every function (Testing Diamond: 70% integration, 20% E2E, 10% unit); direct Supabase calls from components (use hooks).

**Do ask for:** Step-by-step from plans; components per architecture; Storybook for presentational; business logic + tests; integration/E2E; i18n translations; offline support patterns.

---

## Version Control

**Commits:** `type: description` + optional bullet details. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `ci`. No scopes (use `feat:` not `feat(scope):`). **Never commit with `--no-verify`**; run pre-commit hooks (ESLint + Prettier on staged files) and fix failures instead of skipping.

---

## Commands

**Always use `npm run` scripts** for all operations. Never invoke tools directly (e.g. `expo`, `jest`, `eslint`, `prettier`). Only use `npx` when there is no npm script available for the task.

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
npm run test:e2e               # Maestro E2E
npm run test:a11y              # Accessibility tests
npm run test:mutation          # StrykerJS mutation (local only)
npm run validate               # format + lint + type-check + test + build
npm run validate:all           # validate + E2E + a11y
npm run validate:i18n          # Check missing/unused translation keys
npm run storybook              # React Native Storybook
```

**Before commit:** `npm run validate` (format + lint + type-check + test + build).

---

## Documentation

| Doc                                                                                | Purpose                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| [docs/plans/functional-specs.md](docs/plans/functional-specs.md)                   | Product scope, features, user flows               |
| [docs/plans/technical-specs.md](docs/plans/technical-specs.md)                     | Tech stack, patterns, testing, code quality       |
| [docs/plans/architecture.md](docs/plans/architecture.md)                           | System design, feature slices, data flow          |
| [docs/plans/security.md](docs/plans/security.md)                                   | Auth, RLS, privacy, GDPR                          |
| [docs/plans/2026-03-17-feature-design.md](docs/plans/2026-03-17-feature-design.md) | Design decisions, screen-level UX specs           |
| [docs/description.md](docs/description.md)                                         | App description (update with implementation)      |
| [docs/development.md](docs/development.md)                                         | Dev setup, run, debug                             |
| [docs/architecture.md](docs/architecture.md)                                       | Current architecture (update with implementation) |
| [docs/datamodel.md](docs/datamodel.md)                                             | Entities, types, Supabase schema                  |
| [docs/testing.md](docs/testing.md)                                                 | How to run and write tests                        |
| [docs/code-quality.md](docs/code-quality.md)                                       | ESLint, Prettier, hooks, CI                       |

**Keeping docs updated:** When implementing or changing features, update the matching doc. Planning docs in `docs/plans/`. Reference docs describe the current implementation.

---

## Getting Help

1. Check docs/ (functional-specs.md, architecture.md, etc.)
2. Review existing similar components
3. Run Storybook for examples
4. Check test files for usage patterns
5. Ask AI with specific context

**Quick refs:** "How to structure a feature component?" → architecture.md. "Item status transitions?" → functional-specs.md §3.3. "Testing approach?" → technical-specs.md §8. "Screen layout for search?" → 2026-03-17-feature-design.md §3.9.

---

**Version:** 1.0 · **Purpose:** AI-assisted development entry point
