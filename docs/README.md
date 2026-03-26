# Bike Bin — Documentation

This folder contains planning and reference documentation for the Bike Bin application.

## Planning documents (`docs/plans/`)

Implementation plans, specs, and architecture live under **`docs/plans/`** so they stay separate from reference docs.

| Document                                                                           | Description                                               |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [plans/functional-specs.md](plans/functional-specs.md)                             | Product overview, user flows, features, and scope         |
| [plans/technical-specs.md](plans/technical-specs.md)                               | Tech stack, architecture decisions, code quality, testing |
| [plans/architecture.md](plans/architecture.md)                                     | System design, feature slices, layers, patterns           |
| [plans/security.md](plans/security.md)                                             | Authentication, RLS, privacy, GDPR, moderation            |
| [plans/2026-03-17-feature-design.md](plans/2026-03-17-feature-design.md)           | Design decisions, screen-level UX specs                   |
| [plans/2026-03-18-implementation-plan.md](plans/2026-03-18-implementation-plan.md) | Phased implementation plan (14 phases)                    |

## Reference documentation (`docs/`)

These files describe the **current implementation**. Update them when behavior or structure changes.

| Document                           | Description                                        |
| ---------------------------------- | -------------------------------------------------- |
| [description.md](description.md)   | App description, audience, feature summary         |
| [development.md](development.md)   | Dev setup, run, debug, scripts                     |
| [architecture.md](architecture.md) | Current architecture (layers, features, data flow) |
| [datamodel.md](datamodel.md)       | Entities, types, Supabase schema                   |
| [testing.md](testing.md)           | How to run and write tests                         |
| [code-quality.md](code-quality.md) | ESLint, Prettier, hooks, CI                        |

## Source of truth

Each doc should reference the code it describes:

- **Types / data schema:** `src/shared/types/`, `supabase/migrations/`
- **Features:** `src/features/*/`
- **Shared UI & utils:** `src/shared/`
- **Edge Functions:** `supabase/functions/`
- **Dependencies:** `package.json`

## Keeping documentation updated

When changing the codebase, update the corresponding planning or reference doc so they stay in sync.

_(Pattern from [emergency-supply-tracker/docs](https://github.com/ttu/emergency-supply-tracker/tree/main/docs).)_
