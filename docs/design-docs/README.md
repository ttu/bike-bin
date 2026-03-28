# Design Docs

Comprehensive feature-level design documentation for Bike Bin. Each doc covers architecture, data model, screens, key flows, RLS policies, and i18n for its feature slice. Generated from the actual codebase.

## Feature Docs

| #   | Feature       | Doc                                          | Feature Slice                 |
| --- | ------------- | -------------------------------------------- | ----------------------------- |
| 001 | Auth          | [001-auth.md](001-auth.md)                   | `src/features/auth/`          |
| 002 | Onboarding    | [002-onboarding.md](002-onboarding.md)       | `src/features/onboarding/`    |
| 003 | Inventory     | [003-inventory.md](003-inventory.md)         | `src/features/inventory/`     |
| 004 | Bikes         | [004-bikes.md](004-bikes.md)                 | `src/features/bikes/`         |
| 005 | Search        | [005-search.md](005-search.md)               | `src/features/search/`        |
| 006 | Borrow        | [006-borrow.md](006-borrow.md)               | `src/features/borrow/`        |
| 007 | Exchange      | [007-exchange.md](007-exchange.md)           | `src/features/exchange/`      |
| 008 | Messaging     | [008-messaging.md](008-messaging.md)         | `src/features/messaging/`     |
| 009 | Groups        | [009-groups.md](009-groups.md)               | `src/features/groups/`        |
| 010 | Locations     | [010-locations.md](010-locations.md)         | `src/features/locations/`     |
| 011 | Profile       | [011-profile.md](011-profile.md)             | `src/features/profile/`       |
| 012 | Notifications | [012-notifications.md](012-notifications.md) | `src/features/notifications/` |
| 013 | Ratings       | [013-ratings.md](013-ratings.md)             | `src/features/ratings/`       |
| 014 | Demo          | [014-demo.md](014-demo.md)                   | `src/features/demo/`          |

## Cross-Cutting Docs

| #   | Topic                           | Doc                                          |
| --- | ------------------------------- | -------------------------------------------- |
| 015 | Design System (Kinetic Curator) | [015-design-system.md](015-design-system.md) |
| 016 | RLS & Security                  | [016-rls-security.md](016-rls-security.md)   |

## Related Documents

| Need                           | Document                                                   |
| ------------------------------ | ---------------------------------------------------------- |
| Product scope and user stories | [functional-specs.md](../functional-specs.md)              |
| Cross-screen UX decisions      | [feature-design.md](../feature-design.md)                  |
| Schema and RLS                 | `supabase/migrations/` and [datamodel.md](../datamodel.md) |
| Tech stack and patterns        | [technical-specs.md](../technical-specs.md)                |
| Testing strategy               | [testing.md](../testing.md)                                |

## Maintenance

Use `/docs-sync` to validate these docs against the codebase and detect drift. Use `/docs-sync fix` to auto-update.
