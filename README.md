# Bike Bin

**From bikers to bikers.**

A **bike parts inventory** app first—track parts, tools, and builds with photos, condition, and status. **Also:** list for borrow, donation, or sale; discover nearby; use groups; and coordinate handoffs with privacy-friendly locations.

## What it does

- **Inventory (primary)** — your parts, tools, and accessories with photos, condition, usage, and lifecycle status
- **Bike builds** — named bikes and mounted components
- **Borrow, donate, or sell (secondary)** — optional availability when you want to move or share gear
- **Local discovery (secondary)** — search nearby listings within your chosen distance
- **Groups (secondary)** — optional visibility scoped to clubs or crews
- **In-app messaging (secondary)** — item-linked chat when coordinating with others
- **Privacy-first** — area-level pickup context by default; exact address only when both parties agree

## Platforms

iOS, Android, and Web — single codebase, full feature parity.

## Tech stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| Frontend     | Expo + React Native + TypeScript                              |
| Navigation   | Expo Router (file-based)                                      |
| Server state | TanStack Query                                                |
| Backend      | Supabase (Auth, PostgREST, Realtime, Storage, Edge Functions) |
| Database     | PostgreSQL + PostGIS                                          |
| UI           | React Native Paper (Material Design 3)                        |
| i18n         | react-i18next + expo-localization                             |

## Documentation

Specifications and reference docs live in [`docs/`](docs/README.md):

- [Functional specs](docs/functional-specs.md) — product scope, features, user flows
- [Technical specs](docs/technical-specs.md) — stack, patterns, testing, code quality
- [System architecture](docs/system-architecture.md) — system design, feature slices, data flow
- [Security](docs/security.md) — auth, RLS, privacy, GDPR
- [Feature design](docs/feature-design.md) — resolved design decisions, screen-level UX
- [Per-feature design docs](docs/design-docs/README.md) — one doc per feature slice + cross-cutting concerns

## Development

```bash
# Prerequisites: Node.js, npm, Expo CLI, Supabase CLI, Docker

npm install
npm run dev              # Start Supabase + Expo dev server
```

See [docs/development.md](docs/development.md) for full setup instructions. Production web deploy uses **EAS Hosting** and GitHub Actions (see **Web production (EAS Hosting)** in that doc).

### Dependency overrides

`package.json` **overrides** pins `react-native-worklets` to `0.7.4` so a single version is resolved alongside `react-native-reanimated` and Storybook-related dependencies. Remove this pin when upstream versions agree on a compatible `react-native-worklets` release (recheck after Reanimated or Storybook upgrades).

## License

[GNU General Public License v3.0](LICENSE) (GPL-3.0).
