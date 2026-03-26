# Feature design specs

Design specs in this folder describe **what** we are building and **why** we chose particular approaches: user-visible behavior, data and security boundaries, performance trade-offs, and alternatives considered.

They intentionally **do not** duplicate the codebase: no SQL scripts, TypeScript interfaces, component trees, file paths, or step-by-step implementation checklists. Those belong in migrations, types, and tracked implementation work.

**Related documents**

| Need                                         | Document                                                   |
| -------------------------------------------- | ---------------------------------------------------------- |
| Product scope and user stories               | [functional-specs.md](../functional-specs.md)              |
| Cross-screen UX decisions                    | [feature-design.md](../feature-design.md)                  |
| Per-feature behavior and technical decisions | `<slug>-design.md` in this folder                          |
| Schema and RLS                               | `supabase/migrations/` and [datamodel.md](../datamodel.md) |

**Naming:** `<slug>-design.md` (no date in the filename). One topic per doc when possible.

**Index:** See the tables below for main areas and smaller follow-up specs.

## Main product areas

| Area                            | Spec (if present)                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| Auth & onboarding               | _(add `*-auth-and-onboarding-design.md` when needed)_                              |
| App shell & tabs                | _(add when needed)_                                                                |
| Inventory & items               | [item-tags-design.md](item-tags-design.md) (tags sub-feature)                      |
| Bikes                           | _(add when needed)_                                                                |
| Locations / pickup areas        | _(add when needed)_                                                                |
| Availability & visibility       | [availability-action-buttons-design.md](availability-action-buttons-design.md)     |
| Borrow                          | _(add when needed)_                                                                |
| Donate / sell coordination      | _(add when needed)_                                                                |
| Messaging                       | _(add when needed)_                                                                |
| Search                          | [exclude-own-items-from-search-design.md](exclude-own-items-from-search-design.md) |
| Inventory list UX               | [hide-terminal-items-design.md](hide-terminal-items-design.md)                     |
| Notifications                   | _(add when needed)_                                                                |
| Groups                          | _(add when needed)_                                                                |
| Profile & ratings               | _(add when needed)_                                                                |
| Visual system (Kinetic Curator) | [kinetic-curator-design.md](kinetic-curator-design.md) and foundation/phase docs   |

## Engineering / quality specs

| Topic                 | Spec                                                               |
| --------------------- | ------------------------------------------------------------------ |
| RLS integration tests | [rls-integration-tests-design.md](rls-integration-tests-design.md) |

---

_When a design is approved, keep this doc type focused on decisions; link to issues or tasks for file-level work._
