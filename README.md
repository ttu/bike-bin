# Bike Bin

**From bikers to bikers.**

A peer-to-peer bike parts exchange where riders can donate or sell spare parts locally, with privacy-friendly location sharing and easy pickup coordination.

## What it does

- **Inventory management** — track your bike parts, tools, and accessories with photos, condition, and usage
- **Borrow, donate, or sell** — make items available to others with flexible availability types
- **Local discovery** — search for what you need and find nearby offers within your chosen distance
- **Communities** — share gear within groups (clubs, friends, workshop communities)
- **Bike builds** — manage your bikes and track mounted components
- **In-app messaging** — coordinate pickups through item-linked conversations
- **Privacy-first** — only area-level location is shown; exact address shared only when both parties agree

## Platforms

iOS, Android, and Web — single codebase, full feature parity.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Expo + React Native + TypeScript |
| Navigation | Expo Router (file-based) |
| Server state | TanStack Query |
| Backend | Supabase (Auth, PostgREST, Realtime, Storage, Edge Functions) |
| Database | PostgreSQL + PostGIS |
| UI | React Native Paper (Material Design 3) |
| i18n | react-i18next + expo-localization |

## Documentation

Planning and reference docs live in [`docs/`](docs/README.md):

- [Functional Specs](docs/plans/functional-specs.md) — product scope, features, user flows
- [Technical Specs](docs/plans/technical-specs.md) — stack, patterns, testing, code quality
- [Architecture](docs/plans/architecture.md) — system design, feature slices, data flow
- [Security](docs/plans/security.md) — auth, RLS, privacy, GDPR
- [Feature Design](docs/plans/2026-03-17-feature-design.md) — resolved design decisions, screen-level UX

## Development

```bash
# Prerequisites: Node.js, npm, Expo CLI, Supabase CLI

npm install
npx expo start          # Start dev server
supabase start          # Start local Supabase
```

See [docs/development.md](docs/development.md) for full setup instructions.

## License

TBD
