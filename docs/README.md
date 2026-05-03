# Bike Bin — Documentation

This folder contains **specifications**, **design decisions**, and **reference** material for the Bike Bin application.

## Specifications and design

These documents define product behavior, UX decisions, stack conventions, and system shape. **Authoritative behavior** for the running app is always the **code**, **migrations**, and **generated types**; these files explain intent and trade-offs.

| Document                                         | Description                                                     |
| ------------------------------------------------ | --------------------------------------------------------------- |
| [functional-specs.md](functional-specs.md)       | Product overview, user flows, features, scope                   |
| [technical-specs.md](technical-specs.md)         | Tech stack, patterns, testing philosophy, code quality          |
| [system-architecture.md](system-architecture.md) | System design, feature slices, data flow, deployment            |
| [security.md](security.md)                       | Authentication, RLS, privacy, GDPR, moderation                  |
| [feature-design.md](feature-design.md)           | Resolved UX decisions, screen-level flows                       |
| [design-docs/README.md](design-docs/README.md)   | Per-feature design docs (one per feature slice + cross-cutting) |

## Reference documentation

These files describe the **current implementation**. Update them when behavior or structure changes.

| Document                           | Description                                                   |
| ---------------------------------- | ------------------------------------------------------------- |
| [description.md](description.md)   | App description, audience, feature summary                    |
| [development.md](development.md)   | Dev setup, run, debug, scripts                                |
| [architecture.md](architecture.md) | How the repo is structured today (layers, routing, data flow) |
| [datamodel.md](datamodel.md)       | Entities, types, Supabase schema                              |
| [testing.md](testing.md)           | How to run and write tests                                    |
| [code-quality.md](code-quality.md) | ESLint, Prettier, hooks, CI                                   |
| [deployments.md](deployments.md)   | Git ↔ EAS ↔ Supabase environments, web release flow           |

## Where truth lives

| Concern               | Primary source                         |
| --------------------- | -------------------------------------- |
| Schema, RLS, policies | `supabase/migrations/`                 |
| Types                 | `src/shared/types/` (aligned with DB)  |
| App behavior          | `app/`, `src/features/`, `src/shared/` |
| Edge logic            | `supabase/functions/`                  |

## Keeping documentation updated

When you change the codebase, update the matching spec or reference doc so intent stays clear.

_(Pattern from [emergency-supply-tracker/docs](https://github.com/ttu/emergency-supply-tracker/tree/main/docs).)_
