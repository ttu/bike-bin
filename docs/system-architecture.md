# Bike Bin — Architecture

> **Purpose:** System design — components, boundaries, data flow, deployment. Updated as we define the system.  
> **Context:** See [functional-specs.md](functional-specs.md) for product scope and capabilities.  
> **Patterns source:** Adapted from [emergency-supply-tracker/docs](https://github.com/ttu/emergency-supply-tracker/tree/main/docs).

---

## 1. High-level overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              Bike Bin System                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────┐       ┌──────────────────────────────────────────┐  │
│  │  Expo / React Native    │       │  Supabase                               │  │
│  │  (TypeScript)           │       │                                          │  │
│  │                         │  ←→   │  Auth (Google + Apple OAuth)              │  │
│  │  Expo Router (tabs)     │       │  PostgREST API                          │  │
│  │  TanStack Query (cache) │       │  Realtime (messaging, live updates)     │  │
│  │  react-i18next          │       │  Storage (photos)                       │  │
│  │  AsyncStorage (offline) │       │  Edge Functions                         │  │
│  └─────────────────────────┘       │    ├─ send-notification-email → Resend  │  │
│                                    │    ├─ send-push-notification → Expo Push│  │
│                                    │    └─ geocode-postcode → Nominatim      │  │
│                                    │                                          │  │
│                                    │  PostgreSQL + PostGIS                    │  │
│                                    └──────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Client:** Expo + React Native + TypeScript. Expo Router for file-based navigation. TanStack Query for server state caching and offline support. AsyncStorage for offline write queue.
- **Backend:** Supabase — Auth (Google OAuth), PostgREST API, Realtime (messaging + live updates), Object Storage (photos), Edge Functions (notifications, geocoding).
- **Data:** PostgreSQL + PostGIS for entities and geospatial queries. Supabase Storage (S3-backed) for images.
- **External services:** Nominatim (geocoding), Expo Push Notifications (APNs/FCM), Resend (transactional email).

---

## 2. Layered architecture

The app follows a **layered architecture** with **feature slice organization** and **anemic domain models**:

- **Anemic domain models:** Plain TypeScript interfaces (data only, no behavior).
- **Business logic:** Pure utility functions (separated from data).
- **Server state:** **TanStack Query** (React Query) — caching, stale-while-revalidate, retry, cache invalidation. Supabase is the remote data source.
- **Client state:** React Context API for UI/session state (auth, active filters, etc.).
- **Offline layer:** TanStack Query's built-in cache persistence (via AsyncStorage) + offline write queue in AsyncStorage for mutations that fail while offline. Synced when connection returns.
- **UI layer:** React Native components organized by feature slices.
- **Navigation:** Expo Router (file-based routing) with a 4-tab layout.
- **Feature slices:** Self-contained features with components, hooks, utils, and state.

---

## 3. Feature slice architecture

Code is organized by **feature slices**: each feature is self-contained with its own components, hooks, utilities, and state.

### 3.1 Directory structure (target)

```
src/
├── features/                 # Feature slices (domain-driven)
│   ├── inventory/            # Item CRUD, status, photos
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── context.ts
│   │   ├── provider.tsx
│   │   └── index.ts          # Public API
│   ├── bikes/                # Bike management, mounted parts
│   ├── borrow/               # Borrow workflow, requests (accept/reject/return)
│   ├── exchange/             # Donate/sell coordination (via messaging)
│   ├── groups/               # Groups, membership, roles, visibility
│   ├── messaging/            # Item-specific chat, realtime via Supabase
│   ├── search/               # Discovery, filters, distance sort
│   ├── notifications/        # In-app, push, email notification handling
│   ├── ratings/              # Post-transaction ratings and reviews
│   ├── locations/            # Saved locations, geocoding, distance utils
│   ├── profile/              # User profile, settings, public profile view
│   ├── auth/                 # Login, signup, session, onboarding
│   └── onboarding/           # Guided first-time setup (username, photo, location)
├── shared/
│   ├── components/           # Reusable UI primitives
│   ├── hooks/                # Shared hooks (e.g. useOfflineQueue, useNetworkStatus)
│   ├── types/                # Shared TypeScript types / branded IDs
│   ├── utils/                # Cross-feature utilities
│   ├── api/                  # Supabase client, TanStack Query config, helpers
│   └── i18n/                 # react-i18next config, language detection
├── i18n/
│   ├── en/                   # English translations (default)
│   │   ├── common.json
│   │   ├── inventory.json    # Per-feature translation namespaces
│   │   ├── search.json
│   │   └── ...
│   └── {locale}/             # Additional languages follow same structure
└── app/                      # Expo Router — file-based routing
    ├── _layout.tsx           # Root layout (providers, i18n init)
    ├── (auth)/               # Auth screens (login, signup)
    │   ├── login.tsx
    │   └── signup.tsx
    ├── (onboarding)/         # Guided setup screens
    │   ├── profile.tsx
    │   └── location.tsx
    └── (tabs)/               # Main 4-tab layout
        ├── _layout.tsx       # Tab bar configuration
        ├── inventory/        # Inventory tab screens
        │   ├── index.tsx     # Item list (home)
        │   ├── [id].tsx      # Item detail
        │   ├── new.tsx       # Add item
        │   └── bikes/
        │       ├── index.tsx
        │       └── [id].tsx
        ├── search/           # Search tab screens
        │   ├── index.tsx     # Search & discovery
        │   └── [id].tsx      # Listing detail (other user's item)
        ├── messages/         # Messages tab screens
        │   ├── index.tsx     # Conversation list
        │   └── [id].tsx      # Conversation detail
        └── profile/          # Profile tab screens
            ├── index.tsx     # Own profile & settings
            ├── locations.tsx # Manage saved locations
            ├── support.tsx   # Help & Support (feedback form)
            ├── groups/
            │   ├── index.tsx
            │   └── [id].tsx
            └── [userId].tsx  # Other user's public profile
```

### 3.2 Feature structure template

Each feature follows:

```
features/{feature-name}/
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       └── index.ts
├── hooks/
├── utils/
├── types.ts
├── context.ts        # if needed
├── provider.tsx      # if needed
└── index.ts         # Public API exports only
```

### 3.3 Public API pattern

Each feature’s `index.ts` exports only the public API:

```typescript
// features/inventory/index.ts
export { ItemList, ItemForm } from './components/...';
export { useInventory } from './hooks/useInventory';
export { InventoryProvider } from './provider';
export type { InventoryItem } from './types';
export { calculateItemStatus } from './utils/status';
```

---

## 4. Layer details

### 4.1 Data layer (anemic domain models)

- **Location:** `src/shared/types/`, `src/features/*/types.ts`
- **What:** Plain TypeScript interfaces; no methods; JSON-serializable.
- **Bike Bin entities (from functional spec):** User, Item, Bike, Group, BorrowRequest, Conversation, Message, Rating, SavedLocation, ItemPhoto, etc.
- **Used by:** Business logic, TanStack Query hooks, context providers, Supabase API layer.

### 4.2 Business logic layer (pure functions)

- **Location:** `src/shared/utils/`, `src/features/*/utils/`
- **What:** Pure functions on domain models; no side effects.
- **Examples:** Status calculation, visibility rules, borrow workflow transitions, distance formatting, availability type validation.
- **Cross-feature utils** → `shared/utils/`; **feature-specific** → `features/{feature}/utils/`.

### 4.3 Server state (TanStack Query + Supabase)

- **Location:** `src/features/*/hooks/`, `src/shared/api/`
- **What:** TanStack Query manages all server state — fetching, caching, stale-while-revalidate, background refetch, retry, and cache invalidation.
- **Pattern:** Each feature defines query hooks (e.g. `useItems()`, `useBorrowRequests()`) that wrap `useQuery` / `useMutation` with Supabase calls. Query keys follow a consistent convention (e.g. `['items', userId]`, `['conversations', conversationId]`).
- **Supabase client:** Centralized in `shared/api/supabase.ts`. TanStack Query config (defaults, persistence) in `shared/api/queryClient.ts`.

### 4.4 Client state (React Context)

- **Location:** `src/features/*/provider.tsx`, `src/features/*/hooks/`
- **What:** React Context for **UI-only / session state** that doesn't come from the server — e.g. auth session, active search filters, selected tab, onboarding progress.
- **Pattern:** Providers hold client state; hooks expose it. Keep contexts small and focused. Server-derived state belongs in TanStack Query, not Context.

### 4.5 Offline layer

- **Cache persistence:** TanStack Query cache persisted to AsyncStorage (via `@tanstack/query-async-storage-persister`). On app launch, cache is restored so previously loaded data is available immediately.
- **Offline write queue:** Mutations that fail due to no network are stored in AsyncStorage. When connectivity returns (detected via `@react-native-community/netinfo`), queued mutations are replayed in order.
- **UI:** Offline indicator banner shown when network is unavailable. Optimistic updates for queued writes so the UI feels responsive.

### 4.6 i18n layer

- **Location:** `src/shared/i18n/` (config), `src/i18n/{locale}/*.json` (translations)
- **What:** react-i18next initialized at app root. expo-localization detects device locale.
- **Namespaces:** One JSON file per feature (e.g. `inventory.json`, `search.json`) + `common.json` for shared strings. Components use `useTranslation('inventory')` to load the relevant namespace.
- **Pattern:** All user-facing strings go through `t()`. No hardcoded strings in components.

### 4.7 UI layer

- **Location:** `src/features/*/components/`, `src/shared/components/`, screens in `app/`
- **What:** React Native components; use hooks to read state and trigger actions.
- **Navigation:** Expo Router (file-based). Root layout wraps providers (QueryClientProvider, auth context, i18n). Tab layout in `app/(tabs)/_layout.tsx`.

---

## 5. Key architectural patterns

### 5.1 Anemic domain model

- **Data:** Interfaces only (e.g. `InventoryItem`, `Bike`, `BorrowRequest`).
- **Behavior:** In pure functions (e.g. `calculateItemStatus(item)`, `canTransitionToLoaned(request)`).
- **Why:** Easy serialization, testable logic, clear boundaries.

### 5.2 TanStack Query for server state

- All data from Supabase is fetched and cached via TanStack Query hooks.
- **Query hooks** per feature: `useItems()`, `useItem(id)`, `useConversations()`, `useNearbyListings(filters)`, etc.
- **Mutation hooks** for writes: `useCreateItem()`, `useAcceptBorrowRequest()`, `useSendMessage()`, etc.
- **Cache invalidation:** Mutations invalidate relevant query keys (e.g. creating an item invalidates `['items']`).
- **Optimistic updates** for responsive UI (e.g. sending a message appears instantly, confirmed on server response).

### 5.3 Context provider pattern (client state only)

- Context is for **client-only state**: auth session, UI preferences, onboarding progress, active filters.
- Not for server data — that belongs in TanStack Query.
- Components use hooks to get state and actions; no direct Supabase calls in presentational components.

### 5.4 Hook pattern

- Hooks expose context or TanStack Query state; throw if used outside required provider.
- Typed return (state, actions, loading, error).

### 5.5 Feature slice pattern

- One feature = one slice: components, hooks, utils, types, optional context/provider.
- Clear boundaries; locate and test by feature.

### 5.6 Notification architecture

Notifications are a cross-cutting concern spanning three delivery channels:

```
Event (DB change) → Supabase Database Webhook
                     ├─→ Edge Function: send-push-notification → Expo Push API → APNs/FCM → Device (native only)
                     ├─→ Edge Function: send-notification-email → Resend API → User email
                     └─→ Insert into notifications table → Supabase Realtime → Client (in-app badge/list — all platforms)
```

- **Triggers:** New message, borrow request created/accepted/rejected, item return reminder.
- **In-app (all platforms):** `notifications` table, subscribed via Supabase Realtime. `notifications` feature slice manages the badge count and list. On web, this is the only notification channel — users see notifications when they are logged in / have the app open.
- **Push (native only):** Expo Push Notifications (iOS via APNs, Android via FCM). Token registered on app launch, stored in user profile. Edge Function sends via Expo Push API. Not used on web.
- **Email:** Transactional email via Resend, called from Edge Function. User can configure email preferences (which events trigger email).

---

## 6. Data flow (examples)

### Load inventory

App launch → TanStack Query restores cached data from AsyncStorage (instant UI) → background refetch from Supabase (`items` where `owner_id = user`) → cache updated → UI re-renders with fresh data.

### Search nearby items

User enters query + max distance → `useNearbyListings({ query, maxDistance, location })` hook → Supabase RPC call (`search_nearby_items` database function using `ST_DWithin`) → results cached in TanStack Query → UI shows list sorted by distance.

### Borrow request

User taps "Request" on a borrowable item → `useCreateBorrowRequest()` mutation → Supabase insert into `borrow_requests` → DB webhook triggers Edge Functions → push + email notification to owner → owner's app receives Realtime event → owner sees request in UI; owner accepts → update status to Loaned → both UIs update via cache invalidation.

### Messaging (realtime)

User taps "Contact" on a listing → conversation created (or existing one opened) → `useSendMessage()` mutation inserts into `messages` table → Supabase Realtime subscription (`postgres_changes` on `messages` where `conversation_id = X`) delivers new message to the other participant's client → TanStack Query cache updated → both UIs show the message.

### Offline write queue

User creates an item while offline → `useCreateItem()` mutation fails (no network) → mutation stored in AsyncStorage offline queue → UI shows item optimistically with "pending sync" indicator → network returns (detected via NetInfo) → queue replays: Supabase insert → on success, cache invalidated, optimistic state replaced with server data → "pending sync" indicator removed.

### Photos

User takes photo → client-side resize/compress via `expo-image-manipulator` (≤2 MB) → upload to Supabase Storage (`items/{userId}/{itemId}/`) → store storage path in Item row → Supabase Image Transformation generates thumbnails for list views.

### Notifications

DB insert (e.g. new message) → Supabase Database Webhook → Edge Function `send-push-notification` → Expo Push API → device receives push → user taps push → deep link via Expo Router opens the relevant conversation/request screen.

---

## 7. Components

| Component               | Responsibility                          | Interfaces                        |
| ----------------------- | --------------------------------------- | --------------------------------- |
| Expo/RN app             | UI, navigation, forms, offline cache    | Supabase client, TanStack Query   |
| Supabase Auth           | Authentication (Google OAuth), sessions | OAuth, JWT                        |
| Supabase PostgREST      | REST API for CRUD operations            | REST (auto-generated from schema) |
| Supabase Realtime       | Live messaging, notification delivery   | WebSocket subscriptions           |
| Supabase Storage        | Photo storage, image transformation     | Storage API, CDN                  |
| Supabase Edge Functions | Notifications, geocoding                | HTTP (invoked by DB webhooks)     |
| PostgreSQL + PostGIS    | Persistence, geospatial queries         | SQL / PostgREST / RPC             |
| Nominatim (OSM)         | Postcode → coordinates geocoding        | HTTP REST (free, rate-limited)    |
| Expo Push               | Push notification delivery (APNs/FCM)   | Expo Push API                     |
| Resend                  | Transactional email delivery            | REST API                          |

---

## 8. Development approach

Development follows an **incremental, visual-first** principle (see [technical-specs.md §2](technical-specs.md)):

- Every step produces a **visible, runnable** app — no invisible-only infrastructure steps.
- Each increment builds on the previous one with observable improvements.
- Every addition is covered by **unit, integration, E2E, and visual tests** as appropriate.
- Features are wired end-to-end early; no big-bang integration.

---

## 9. Deployment & environment

### Environments

| Environment    | Supabase                                                                                                | App build                                                                                | Purpose                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Local**      | Supabase CLI (`supabase start`) — local PostgreSQL + PostGIS, local Auth, local Storage                 | Expo Go / dev client + `expo start --web`                                                | Day-to-day development                                                                                                  |
| **PR Preview** | **Supabase Branching** — automatic preview database per PR (branched from staging, includes migrations) | **EAS Update** preview channel + **Vercel** preview deployment (automatic per PR)        | Test new features in isolation before merge. PR description includes QR code / link to preview build + web preview URL. |
| **Staging**    | Hosted Supabase project (staging)                                                                       | EAS Build staging channel + Vercel staging deployment                                    | Integration testing, E2E (Maestro), QA before production release                                                        |
| **Production** | Hosted Supabase project (prod)                                                                          | EAS Build production channel (App Store / Play Store) + **Vercel production** deployment | Live users. Web is continuously deployed; mobile releases go through store review.                                      |

### CI/CD flow

#### CI job structure (GitHub Actions)

_(Pattern from [emergency-supply-tracker CI](https://github.com/ttu/emergency-supply-tracker/blob/main/.github/workflows/ci.yml).)_

```
┌──────┐ ┌────────────┐ ┌──────┐ ┌───────────┐ ┌─────┐ ┌──────┐
│ lint │ │ type-check │ │ test │ │ storybook │ │ e2e │ │ a11y │
└──┬───┘ └─────┬──────┘ └──┬───┘ └─────┬─────┘ └──┬──┘ └──┬───┘
   └───────────┴────────────┴───────────┴──────────┴───────┘
                              │
                         ┌────▼────┐    ┌────────┐
                         │  build  │    │ visual │  (non-blocking)
                         └─────────┘    └────────┘
```

| Job          | What it does                                                                           | Blocks build? |
| ------------ | -------------------------------------------------------------------------------------- | ------------- |
| `lint`       | ESLint + Prettier check + `validate:i18n` (missing translation keys)                   | Yes           |
| `type-check` | TypeScript type checking (all tsconfig files)                                          | Yes           |
| `test`       | Jest unit/integration tests with coverage → upload to Codecov                          | Yes           |
| `storybook`  | Storybook interaction/component tests                                                  | Yes           |
| `e2e`        | Maestro E2E tests against development build. Upload report as artifact.                | Yes           |
| `a11y`       | Accessibility E2E tests (axe-core). Upload report as artifact.                         | Yes           |
| `visual`     | Visual regression screenshot tests. Non-blocking — failed diffs uploaded as artifacts. | **No**        |
| `build`      | EAS Build (native) + Expo web export (runs after all blocking jobs pass)               | —             |

**Triggers:** Push to `main`, pull requests to `main`.

**External checks (automatic):**

- **Codecov** — coverage diff comment + status check on every PR.
- **SonarCloud** — static analysis + quality gate status on every PR.

#### Deployment flow

1. **PR opened** → GitHub Actions: all CI jobs run in parallel → Supabase creates preview branch DB → EAS builds preview → Vercel deploys web preview → PR comment with mobile preview link + web preview URL.
2. **PR merged to main** → GitHub Actions: full test suite → deploy migrations to staging Supabase → EAS Update to staging channel → **Vercel auto-deploys web to production** (continuous deployment) → Maestro E2E against staging.
3. **Mobile release** → Promote staging to production: apply migrations to prod Supabase → EAS Submit to App Store / Play Store (or OTA update for JS-only changes via EAS Update).

**Web continuous deployment:** The web version is deployed to Vercel on every merge to `main`. No store review, no waiting — features are live immediately. This allows for rapid iteration and early user feedback before the same changes ship to mobile stores.

### Secrets & config

- **Supabase URL / anon key:** Per-environment, stored in Expo config (`.env.local`, `.env.staging`, `.env.production`) and GitHub Actions secrets.
- **Service role key:** Never in client. Used in Edge Functions and CI only.
- **Resend API key:** In Supabase Edge Function secrets (per environment).
- **Google OAuth client ID/secret:** In Supabase dashboard (per project/environment).

---

## 10. Boundaries & constraints

- **Module boundaries:** Features depend only on `shared/` and their own slice; no feature-to-feature imports of internals. Cross-feature communication goes through shared hooks, query cache invalidation, or navigation (deep links).
- **External boundaries:** All server access via Supabase client (centralized in `shared/api/`). No direct HTTP calls to Supabase from components.
- **Image limits:** Max ~2 MB per photo after client-side compression. Supabase Storage bucket policies enforce max upload size. Thumbnail generation via Supabase Image Transformation.
- **Geocoding rate limits:** Nominatim: max 1 request/sec, results cached in DB. Geocoding happens server-side (Edge Function), not client-side.
- **Supabase plan limits:** Monitor row counts, storage, bandwidth. Plan upgrade path documented.

---

## 11. Design docs (when to write)

Create a design doc for:

- New major features or workflows (e.g. borrow flow, messaging).
- Significant architectural changes (e.g. offline-first, new sync model).
- Complex business logic or data model changes.
- Cross-cutting concerns (notifications, permissions).

Do **not** create a design doc for:

- Simple bug fixes, UI-only tweaks, minor refactors, or doc-only updates.

_(Pattern from [emergency-supply-tracker DESIGN_DOCS_INDEX](https://github.com/ttu/emergency-supply-tracker/blob/main/docs/DESIGN_DOCS_INDEX.md).)_

---

## 12. Documentation & source of truth

- **Specification docs** live alongside reference docs under `docs/` (see [docs/README.md](README.md)).
- **Source of truth:** Types in `src/shared/types/`; features in `src/features/`; Supabase schema in migrations. Keep docs in sync when changing code.

---

_Last updated: 2026-03-17_
