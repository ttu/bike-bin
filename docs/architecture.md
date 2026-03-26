# Bike Bin — Architecture (Reference)

> **Purpose:** How the application is structured today — layers, feature slices, routing, and data flow.  
> **Target design & diagrams:** [plans/architecture.md](plans/architecture.md).  
> **Source of truth:** `app/`, `src/features/`, `src/shared/`, `supabase/`.

---

## Stack (summary)

| Layer          | Technology                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| App shell      | Expo SDK 55, React 19, React Native / React Native Web                                                          |
| Navigation     | Expo Router (file-based routes under `app/`)                                                                    |
| UI             | React Native Paper (Material Design 3), shared theme in `src/shared/theme/`                                     |
| Font           | **Manrope** (Google Font via `@expo-google-fonts/manrope`) — all MD3 typography roles mapped to Manrope weights |
| Server state   | TanStack Query (`@tanstack/react-query`), with AsyncStorage persistence for offline-friendly caching            |
| Backend        | Supabase — Auth, PostgREST, Realtime, Storage, Edge Functions                                                   |
| Edge Functions | `delete-account`, `geocode-postcode` (Nominatim), `notify-support` — in `supabase/functions/`                   |
| Database       | PostgreSQL + PostGIS (spatial queries, saved locations)                                                         |
| i18n           | `react-i18next`, translations under `src/i18n/`                                                                 |
| Observability  | Sentry (`@sentry/react-native`) — error tracking, crash reports                                                 |

---

## Repository layout

```
app/                    # Expo Router: screens and layouts
src/
  features/             # Feature slices (public API via index.ts)
  shared/               # Cross-cutting UI, API, types, theme, i18n setup
  i18n/                 # Locale JSON namespaces
  test/                 # Jest setup and shared test utilities
supabase/
  migrations/           # Schema DDL and RLS (source of truth for DB)
  functions/            # Edge Functions (Deno / TypeScript)
```

Features **do not** import from other features’ internals; they use `src/shared/` and their own slice. Shared code is imported via `@/` (see `jest.config.js` `moduleNameMapper` and TypeScript paths).

---

## Feature slices (implemented)

Each slice typically contains `components/`, `hooks/`, `utils/`, optional `context` / `provider`, and `index.ts` exports.

| Slice           | Role                                      |
| --------------- | ----------------------------------------- |
| `auth`          | Session, login/signup flows               |
| `onboarding`    | First-run setup                           |
| `inventory`     | Items, photos, status, availability       |
| `bikes`         | Bike entities and photos                  |
| `search`        | Discovery and listing detail              |
| `borrow`        | Borrow requests                           |
| `exchange`      | Donate/sell coordination (with messaging) |
| `messaging`     | Conversations and messages                |
| `groups`        | Groups and membership                     |
| `locations`     | Saved locations and geocoding helpers     |
| `profile`       | User profile and settings                 |
| `notifications` | In-app notifications                      |
| `ratings`       | Ratings after transactions                |
| `demo`          | Demo / scaffolding (if present)           |

---

## Routing (`app/`)

High-level structure:

- Root `app/_layout.tsx` — provider stack: SafeAreaProvider → QueryClientProvider → ThemePreferenceProvider → PaperProvider → DemoModeProvider → AuthProvider. Font loading (Manrope), Sentry init, and i18n config also happen here.
- `app/(auth)/` — unauthenticated routes (e.g. login).
- `app/(onboarding)/` — guided setup.
- `app/(tabs)/` — main **four-tab** shell: **Inventory**, **Search**, **Messages**, **Profile** (each with its own stack/layout).

File names map to URLs; dynamic segments use `[id]` (or similar) as in Expo Router conventions.

---

## Data flow

1. **Reads:** Components call TanStack Query hooks that use the Supabase client (`src/shared/api/`) to query PostgREST or RPC functions. Cache keys and invalidation are colocated with hooks.
2. **Writes:** Mutations go through Supabase (insert/update/delete) or Storage for uploads; TanStack Query invalidates affected queries on success.
3. **Realtime:** Messaging and other live updates use Supabase Realtime subscriptions where implemented (see feature code and migrations).
4. **Auth:** Supabase Auth session drives protected routes; JWT is sent automatically by the client. **Row Level Security** in Postgres enforces access — the client is not the security boundary.

---

## Types and IDs

Shared TypeScript models and **branded ID types** (e.g. `ItemId`, `UserId`) live in `src/shared/types/`. They mirror the database shape where the app serializes snake_case columns to camelCase in the API layer.

---

## When to update this doc

Update when you add or rename feature slices, change the tab structure, or move shared concerns between `shared/` and features.
