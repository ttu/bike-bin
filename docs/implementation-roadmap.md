# Bike Bin — Implementation roadmap

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a peer-to-peer bike parts exchange app (iOS, Android, Web) from an empty repo to a fully functional product, incrementally — every phase produces a runnable app.

**Architecture:** Expo + React Native + TypeScript frontend with Supabase backend (Auth, PostgREST, Realtime, Storage, Edge Functions). Feature slice organization under `src/features/`. TanStack Query for server state, React Context for client state. React Native Paper (MD3) for UI.

**Tech Stack:** Expo SDK 52+, React Native, TypeScript (strict), Expo Router, TanStack Query, Supabase, React Native Paper, react-i18next, Jest + RNTL, Maestro, StrykerJS, Storybook, GitHub Actions.

**Specs:** [functional-specs.md](functional-specs.md), [technical-specs.md](technical-specs.md), [system-architecture.md](system-architecture.md), [security.md](security.md), [feature-design.md](feature-design.md)

---

## Build Sequence

Each phase produces a visible, runnable app. Phases are sequential — each builds on the previous.

| Phase | What it builds                              | Runnable result                              |
| ----- | ------------------------------------------- | -------------------------------------------- |
| 1     | Project scaffold + theme + navigation shell | App with 5-tab shell, themed, i18n-ready     |
| 2     | Supabase setup + shared types + API layer   | Database schema, types, Supabase client      |
| 3     | Auth + onboarding                           | Sign in with Google/Apple, guided setup      |
| 4     | Inventory (items)                           | Add/edit/delete items, photo upload, status  |
| 5     | Locations                                   | Saved locations, geocoding, primary location |
| 6     | Search & discovery                          | Search, filters, distance, listing detail    |
| 7     | Messaging                                   | Item-linked conversations, realtime chat     |
| 8     | Borrow workflow                             | Request/accept/reject/return flow            |
| 9     | Donate & sell                               | Mark as donated/sold, exchange coordination  |
| 10    | Bikes                                       | Bike management, mounted parts               |
| 11    | Groups                                      | Group CRUD, membership, visibility scoping   |
| 12    | Ratings & reviews                           | Post-transaction ratings, public profile     |
| 13    | Notifications                               | In-app center, push (native), email          |
| 14    | Profile, support & polish                   | Settings, help form, account deletion, CI    |

---

## Chunk 1: Foundation (Phases 1–2)

### Phase 1: Project Scaffold + Theme + Navigation Shell

**Goal:** Runnable Expo app with bottom tab navigation, MD3 theme (light + dark), i18n framework, and dev tooling.

#### Task 1.1: Initialize Expo project

**Files:**

- Create: `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`
- Create: `.eslintrc.js`, `.prettierrc`, `.husky/pre-commit`
- Create: `codecov.yml`

- [x] **Step 1: Create Expo project with TypeScript template**

```bash
npx create-expo-app@latest bike-bin --template blank-typescript
cd bike-bin
```

- [x] **Step 2: Install core dependencies**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npm install react-native-paper react-native-vector-icons @expo/vector-icons
npm install @tanstack/react-query @tanstack/query-async-storage-persister @react-native-async-storage/async-storage
npm install react-i18next i18next expo-localization
npm install @supabase/supabase-js
npm install @react-native-community/netinfo
```

- [x] **Step 3: Install dev dependencies**

```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier
npm install -D husky lint-staged
npm install -D jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest
npm install -D @storybook/react-native @storybook/addon-actions @storybook/addon-controls
npm install -D @faker-js/faker
npx husky init
```

- [x] **Step 4: Configure TypeScript strict mode**

`tsconfig.json` — enable `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Extend Expo's base config.

- [x] **Step 5: Configure ESLint + Prettier**

Create `.eslintrc.js` with TypeScript + React Native rules. Create `.prettierrc` with project defaults (single quotes, trailing commas, 100 print width). Configure `lint-staged` in `package.json` for pre-commit.

- [x] **Step 6: Configure Jest**

Create `jest.config.js` with `jest-expo` preset. Configure coverage thresholds (80% branches/functions/lines/statements). Setup `src/test/setup.ts` for RNTL and i18n mock.

- [x] **Step 7: Add npm scripts to package.json**

Scripts: `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`, `validate`, `validate:i18n`, `storybook`. Match scripts listed in [technical-specs.md §9](technical-specs.md).

- [x] **Step 8: Create codecov.yml**

Target: auto for project, 80% for patch, 1% threshold. Exclude test files.

- [x] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: initialize Expo project with TypeScript and dev tooling"
```

#### Task 1.2: Theme system

**Files:**

- Create: `src/shared/theme/theme.ts`
- Create: `src/shared/theme/spacing.ts`
- Create: `src/shared/theme/index.ts`
- Test: `src/shared/theme/__tests__/theme.test.ts`

- [x] **Step 1: Write test for theme tokens**

```typescript
// src/shared/theme/__tests__/theme.test.ts
import { lightTheme, darkTheme, spacing, borderRadius, iconSize } from '../index';

describe('Theme', () => {
  it('defines light theme with teal primary', () => {
    expect(lightTheme.colors.primary).toBe('#0D9488');
  });

  it('defines dark theme with teal primary', () => {
    expect(darkTheme.colors.primary).toBe('#2DD4BF');
  });

  it('defines spacing scale', () => {
    expect(spacing.base).toBe(16);
    expect(spacing.xs).toBe(4);
  });

  it('defines border radius tokens', () => {
    expect(borderRadius.md).toBe(12);
    expect(borderRadius.full).toBe(9999);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="theme.test"
```

- [x] **Step 3: Implement theme**

Create `theme.ts` extending Paper's `MD3LightTheme` / `MD3DarkTheme` with the color palette from [technical-specs.md §2](technical-specs.md) (teal/slate palette). Create `spacing.ts` with spacing scale (xs=4, sm=8, md=12, base=16, lg=24, xl=32, 2xl=48), border radius (sm=8, md=12, lg=16, full=9999), icon sizes (sm=20, md=24, lg=32, xl=48), elevation styles. Export all from `index.ts`.

- [x] **Step 4: Run test to verify it passes**

- [x] **Step 5: Commit**

```bash
git add src/shared/theme/
git commit -m "feat: add MD3 theme with teal palette, spacing, and design tokens"
```

#### Task 1.3: i18n setup

**Files:**

- Create: `src/shared/i18n/config.ts`
- Create: `src/shared/i18n/index.ts`
- Create: `src/i18n/en/common.json`
- Test: `src/shared/i18n/__tests__/config.test.ts`

- [x] **Step 1: Write test for i18n initialization**

Test that i18n initializes with English default, returns keys for missing translations, and exports `t` function.

- [x] **Step 2: Implement i18n config**

Configure react-i18next with `expo-localization` for device locale detection. English as default and fallback. Namespace-based loading (common + per-feature). Create `src/i18n/en/common.json` with initial keys for tab labels, common actions (save, cancel, delete, edit, back), and app name.

- [x] **Step 3: Run tests, commit**

```bash
git commit -m "feat: add i18n framework with English translations"
```

#### Task 1.4: Navigation shell (5-tab layout)

**Files:**

- Create: `app/_layout.tsx` (root layout — providers)
- Create: `app/(tabs)/_layout.tsx` (tab bar config)
- Create: `app/(tabs)/inventory/index.tsx` (placeholder)
- Create: `app/(tabs)/bikes/index.tsx` (placeholder or full bikes stack)
- Create: `app/(tabs)/search/index.tsx` (placeholder)
- Create: `app/(tabs)/messages/index.tsx` (placeholder)
- Create: `app/(tabs)/profile/index.tsx` (placeholder)

- [x] **Step 1: Create root layout with providers**

`app/_layout.tsx` wraps the app with `PaperProvider` (theme), `QueryClientProvider` (TanStack Query), i18n initialization, and `SafeAreaProvider`. Uses `useColorScheme()` to pick light/dark theme.

- [x] **Step 2: Create tab layout**

`app/(tabs)/_layout.tsx` configures 5 tabs using Expo Router `<Tabs>`: Inventory (home), Bikes (bicycle), Search (magnify), Messages (chat), Profile (account). Teal active icon, `onSurfaceVariant` inactive. Use `MaterialCommunityIcons` from `@expo/vector-icons`.

- [x] **Step 3: Create placeholder screens**

Each tab gets a placeholder screen with the tab name as a heading, using Paper `<Text variant="headlineLarge">` and theme background color. Enough to verify navigation works.

- [x] **Step 4: Write integration test for tab navigation**

Test that all 5 tabs render and are navigable. Use `renderWithProviders` wrapper (create `src/test/utils.tsx` with providers).

- [x] **Step 5: Verify app runs**

```bash
npx expo start --web
```

Visual check: 5 tabs visible, active tab highlighted teal, theme applied, light/dark mode works.

- [x] **Step 6: Commit**

```bash
git commit -m "feat: add 5-tab navigation shell with themed layout"
```

#### Task 1.5: CI pipeline (GitHub Actions)

**Files:**

- Create: `.github/workflows/ci.yml`

- [x] **Step 1: Create basic CI workflow**

Initial CI with parallel jobs: `lint` (ESLint + Prettier), `type-check` (TypeScript), `test` (Jest + coverage → Codecov). Triggers on push to `main` and PRs. Additional jobs (`storybook`, `e2e`, `a11y`, `visual`, `build`) added as features are implemented.

- [x] **Step 2: Commit**

```bash
git commit -m "ci: add initial GitHub Actions CI pipeline"
```

#### Task 1.6: Sentry error tracking

**Files:**

- Modify: `app/_layout.tsx`

- [x] **Step 1: Install and configure Sentry**

```bash
npx expo install @sentry/react-native
```

Initialize Sentry in root layout with DSN from env var. Wrap root layout with `Sentry.wrap()`.

- [x] **Step 2: Commit**

```bash
git commit -m "chore: add Sentry error tracking from day one"
```

#### Task 1.7: Shared components (EmptyState, LoadingScreen)

**Files:**

- Create: `src/shared/components/EmptyState/EmptyState.tsx`
- Create: `src/shared/components/EmptyState/index.ts`
- Create: `src/shared/components/LoadingScreen/LoadingScreen.tsx`
- Create: `src/shared/components/index.ts`
- Test: `src/shared/components/EmptyState/__tests__/EmptyState.test.tsx`
- Story: `src/shared/components/EmptyState/EmptyState.stories.tsx`

- [x] **Step 1: Write test for EmptyState component**

Test: renders icon, title, description, and optional CTA button. Test: CTA button fires onPress.

- [x] **Step 2: Implement EmptyState**

Props: `icon` (string — MaterialCommunityIcons name), `title` (string), `description` (string), `ctaLabel?` (string), `onCtaPress?` (function). Uses theme tokens for spacing and colors. Centered layout per [feature-design.md §4.2](feature-design.md).

- [ ] **Step 3: Create Storybook story** _(deferred — Storybook not yet configured)_

Show EmptyState with and without CTA button.

- [x] **Step 4: Implement LoadingScreen (skeleton placeholder)**

Simple centered `ActivityIndicator` for now. Skeleton screens added per-feature later.

- [x] **Step 5: Run tests, commit**

```bash
git commit -m "feat: add EmptyState and LoadingScreen shared components"
```

### Phase 2: Supabase Setup + Shared Types + API Layer

**Goal:** Local Supabase running with full schema, TypeScript types matching DB, and configured Supabase client with TanStack Query.

#### Task 2.1: Initialize Supabase project

**Files:**

- Create: `supabase/config.toml`
- Create: `.env.local` (gitignored)
- Create: `.env.example`

- [x] **Step 1: Initialize Supabase**

```bash
supabase init
```

- [x] **Step 2: Configure local environment**

Create `.env.local` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for local dev. Create `.env.example` as template. Add `.env.local` to `.gitignore`.

- [x] **Step 3: Enable PostGIS**

Create migration to enable PostGIS extension:

```sql
-- supabase/migrations/00001_enable_postgis.sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

- [x] **Step 4: Start and verify**

```bash
supabase start
```

- [x] **Step 5: Commit**

```bash
git commit -m "chore: initialize Supabase with PostGIS extension"
```

#### Task 2.2: Database schema — core tables

**Files:**

- Create: `supabase/migrations/00002_create_core_tables.sql`

- [x] **Step 1: Write migration for profiles, saved_locations, items, item_photos, bikes**

Tables based on [technical-specs.md §4](technical-specs.md):

- `profiles` — id (FK to auth.users), display_name, avatar_url, rating_avg, rating_count, created_at, updated_at
- `saved_locations` — id, user_id, label, area_name, postcode, coordinates (geography(Point, 4326)), is_primary, created_at
- `items` — id, owner_id, name, category (enum: component/tool/accessory/bike), brand, model, description, condition (enum: new/good/worn/broken), status (enum: stored/mounted/loaned/reserved/donated/sold/archived), availability_types (text[]), price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id (FK), visibility (enum: private/groups/all), created_at, updated_at
- `item_photos` — id, item_id, storage_path, sort_order, created_at
- `bikes` — id, owner_id, name, brand, model, type (enum: road/gravel/mtb/city/touring/other), year, bike_id on items table (nullable FK)

Spatial index on `saved_locations.coordinates`. Indexes on `items.owner_id`, `items.status`, `items.category`.

- [x] **Step 2: Apply migration**

```bash
supabase db reset
```

- [x] **Step 3: Commit**

```bash
git commit -m "feat: add core database tables (profiles, items, locations, bikes)"
```

#### Task 2.3: Database schema — social tables

**Files:**

- Create: `supabase/migrations/00003_create_social_tables.sql`

- [x] **Step 1: Write migration for groups, group_members, borrow_requests, conversations, messages, ratings, notifications, support_requests**

Tables based on [technical-specs.md §4](technical-specs.md):

- `groups` — id, name, description, is_public, created_at
- `group_members` — group_id, user_id, role (enum: admin/member), joined_at
- `item_groups` — item_id, group_id (junction table for group-scoped visibility)
- `borrow_requests` — id, item_id, requester_id, status (enum: pending/accepted/rejected/returned/cancelled), message, created_at, updated_at
- `conversations` — id, item_id, created_at
- `conversation_participants` — conversation_id, user_id
- `messages` — id, conversation_id, sender_id, body, created_at
- `ratings` — id, from_user_id, to_user_id, item_id, transaction_type (enum: borrow/donate/sell), score (1-5), text, created_at, updated_at, editable_until (timestamp)
- `notifications` — id, user_id, type, title, body, data (jsonb), is_read, created_at
- `support_requests` — id, user_id (nullable), email (nullable), subject, body, screenshot_path, app_version, device_info, status (enum: open/closed), created_at
- `reports` — id, reporter_id, target_type (enum: item/user), target_id, reason, text, status (enum: open/reviewed/closed), created_at

Also add to `profiles` table: `notification_preferences` (jsonb, default all enabled), `push_token` (text, nullable).

- [x] **Step 2: Apply migration, commit**

```bash
git commit -m "feat: add social database tables (groups, messaging, borrow, ratings)"
```

#### Task 2.4: Row Level Security policies

**Files:**

- Create: `supabase/migrations/00004_rls_policies.sql`

- [x] **Step 1: Write RLS policies for all tables**

Based on [security.md §2](security.md). Enable RLS on every table. Key policies:

- `profiles`: public SELECT (display_name, avatar_url, rating_avg, rating_count); own INSERT/UPDATE/DELETE
- `items`: public SELECT for visibility='all' items; own INSERT/UPDATE/DELETE (not while loaned/reserved)
- `saved_locations`: own only (all operations)
- `bikes`: own only
- `groups`/`group_members`: public groups readable by all; private by members; admin writes
- `borrow_requests`: requester or item owner SELECT; requester INSERT; owner UPDATE (accept/reject); requester UPDATE (cancel)
- `conversations`/`messages`: participants only
- `ratings`: public SELECT; authenticated INSERT (after transaction); own UPDATE (within editable_until); own DELETE (author can delete anytime)
- `notifications`: own only
- `support_requests`: own or unauthenticated INSERT; own SELECT

- [x] **Step 2: Apply migration, commit**

```bash
git commit -m "feat: add RLS policies for all tables"
```

#### Task 2.5: Database functions

**Files:**

- Create: `supabase/migrations/00005_functions.sql`

- [x] **Step 1: Write database functions**

- `search_nearby_items(query text, lat float, lng float, max_distance_meters int, ...)` — PostGIS `ST_DWithin` query returning items with distance, filtered by availability, category, condition, offer type, price range, group
- `update_user_rating_avg()` — trigger function to recalculate `profiles.rating_avg` and `rating_count` on rating INSERT/UPDATE/DELETE
- `create_profile_on_signup()` — trigger on `auth.users` INSERT to auto-create a `profiles` row

- [x] **Step 2: Apply migration, commit**

```bash
git commit -m "feat: add database functions (search, rating triggers, profile creation)"
```

#### Task 2.6: Shared TypeScript types

**Files:**

- Create: `src/shared/types/ids.ts` (branded IDs)
- Create: `src/shared/types/models.ts` (domain models)
- Create: `src/shared/types/enums.ts` (status, category, etc.)
- Create: `src/shared/types/index.ts`
- Test: `src/shared/types/__tests__/enums.test.ts`

- [x] **Step 1: Define branded ID types**

```typescript
// src/shared/types/ids.ts
declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type BikeId = Brand<string, 'BikeId'>;
export type GroupId = Brand<string, 'GroupId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type LocationId = Brand<string, 'LocationId'>;
export type BorrowRequestId = Brand<string, 'BorrowRequestId'>;
export type RatingId = Brand<string, 'RatingId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
```

- [x] **Step 2: Define enums**

```typescript
// src/shared/types/enums.ts
export const ItemCategory = {
  Component: 'component',
  Tool: 'tool',
  Accessory: 'accessory',
  Bike: 'bike',
} as const;
export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory];

export const ItemCondition = { New: 'new', Good: 'good', Worn: 'worn', Broken: 'broken' } as const;
export type ItemCondition = (typeof ItemCondition)[keyof typeof ItemCondition];

export const ItemStatus = {
  Stored: 'stored',
  Mounted: 'mounted',
  Loaned: 'loaned',
  Reserved: 'reserved',
  Donated: 'donated',
  Sold: 'sold',
  Archived: 'archived',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const AvailabilityType = {
  Borrowable: 'borrowable',
  Donatable: 'donatable',
  Sellable: 'sellable',
  Private: 'private',
} as const;
export type AvailabilityType = (typeof AvailabilityType)[keyof typeof AvailabilityType];

export const Visibility = { Private: 'private', Groups: 'groups', All: 'all' } as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const BorrowRequestStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Returned: 'returned',
  Cancelled: 'cancelled',
} as const;
export type BorrowRequestStatus = (typeof BorrowRequestStatus)[keyof typeof BorrowRequestStatus];

export const GroupRole = { Admin: 'admin', Member: 'member' } as const;
export type GroupRole = (typeof GroupRole)[keyof typeof GroupRole];

export const BikeType = {
  Road: 'road',
  Gravel: 'gravel',
  MTB: 'mtb',
  City: 'city',
  Touring: 'touring',
  Other: 'other',
} as const;
export type BikeType = (typeof BikeType)[keyof typeof BikeType];
```

- [x] **Step 3: Define domain model interfaces**

`models.ts` with interfaces for: `UserProfile`, `SavedLocation`, `Item`, `ItemPhoto`, `Bike`, `Group`, `GroupMember`, `BorrowRequest`, `Conversation`, `Message`, `Rating`, `Notification`, `SupportRequest`. All using branded IDs. JSON-serializable (no methods).

- [x] **Step 4: Write tests for enum values, commit**

```bash
git commit -m "feat: add shared TypeScript types (branded IDs, enums, domain models)"
```

#### Task 2.7: Supabase client + TanStack Query setup

**Files:**

- Create: `src/shared/api/supabase.ts`
- Create: `src/shared/api/queryClient.ts`
- Create: `src/shared/api/index.ts`
- Test: `src/shared/api/__tests__/queryClient.test.ts`

- [x] **Step 1: Create Supabase client**

`supabase.ts` — initialize `createClient` with env vars. Export typed client.

- [x] **Step 2: Create TanStack Query client**

`queryClient.ts` — configure `QueryClient` with defaults (staleTime: 5 min, retry: 2, refetchOnWindowFocus). Configure AsyncStorage persister for offline cache. Export `queryClient` and `QueryClientProvider` wrapper.

- [x] **Step 3: Write test for query client defaults**

- [x] **Step 4: Update root layout to use new providers**

Update `app/_layout.tsx` to import and use the configured `QueryClientProvider` and pass the Supabase-connected query client.

- [x] **Step 5: Commit**

```bash
git commit -m "feat: add Supabase client and TanStack Query configuration"
```

#### Task 2.8: Test data factories

**Files:**

- Create: `src/test/factories.ts`
- Create: `src/test/utils.tsx` (update — add renderWithProviders)
- Test: `src/test/__tests__/factories.test.ts`

- [x] **Step 1: Create factories using faker**

`factories.ts` — `createMockUser()`, `createMockItem()`, `createMockBike()`, `createMockLocation()`, `createMockConversation()`, `createMockMessage()`, `createMockBorrowRequest()`, `createMockRating()`, `createMockGroup()`. Each returns a full typed object with randomized data. Support overrides via partial parameter.

- [x] **Step 2: Create renderWithProviders utility**

`utils.tsx` — wraps component with `PaperProvider`, `QueryClientProvider` (fresh client per test), i18n mock, `SafeAreaProvider`. Export as `renderWithProviders(ui, options?)`.

- [x] **Step 3: Write test verifying factories produce valid typed objects**

- [x] **Step 4: Commit**

```bash
git commit -m "test: add test data factories and renderWithProviders utility"
```

---

## Chunk 2: Auth & Onboarding (Phase 3)

### Phase 3: Auth + Onboarding

**Goal:** Users can sign in with Google/Apple, go through onboarding, and see their session state. Unauthenticated users can browse (limited).

#### Task 3.1: Auth context + provider

**Files:**

- Create: `src/features/auth/context.ts`
- Create: `src/features/auth/provider.tsx`
- Create: `src/features/auth/hooks/useAuth.ts`
- Create: `src/features/auth/index.ts`
- Test: `src/features/auth/__tests__/useAuth.test.tsx`

- [x] **Step 1: Write test for useAuth hook**

Test: returns `null` session when not logged in. Test: returns user session after login. Test: `signOut` clears session. Test: `isAuthenticated` boolean is correct.

- [x] **Step 2: Implement AuthContext and AuthProvider**

`context.ts` — defines `AuthContextType` with `session`, `user`, `isAuthenticated`, `isLoading`, `signInWithGoogle`, `signInWithApple`, `signOut`. `provider.tsx` — wraps children, subscribes to `supabase.auth.onAuthStateChange`, manages session state.

- [x] **Step 3: Implement useAuth hook**

Consumes context, throws if used outside provider.

- [x] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add auth context, provider, and useAuth hook"
```

#### Task 3.2: Welcome screen (login)

**Files:**

- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `src/i18n/en/auth.json`
- Test: `app/(auth)/__tests__/login.test.tsx`

- [x] **Step 1: Write test for welcome screen**

Test: renders app logo/title. Test: renders "Continue with Apple" button. Test: renders "Continue with Google" button. Test: renders "Browse without signing in" link. Test: tapping sign-in calls auth method.

- [x] **Step 2: Implement welcome screen**

Per [feature-design.md §3.1](feature-design.md). App logo + tagline, Apple sign-in button (dark), Google sign-in button (outlined), "Browse without signing in" link. Use Paper components + theme tokens.

- [x] **Step 3: Add auth translations to en/auth.json**

Keys: `auth.welcome.title`, `auth.welcome.tagline`, `auth.welcome.continueWithApple`, `auth.welcome.continueWithGoogle`, `auth.welcome.browseWithout`.

- [x] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add welcome screen with Google/Apple sign-in"
```

#### Task 3.3: Auth routing (protected routes)

**Files:**

- Modify: `app/_layout.tsx`
- Create: `src/features/auth/components/AuthGate/AuthGate.tsx`

- [x] **Step 1: Implement auth-based routing**

Root layout checks auth state: no session → show `(auth)` group. Has session but profile incomplete → show `(onboarding)` group. Has session + profile complete → show `(tabs)` group. "Browse without signing in" → show `(tabs)` with limited access.

- [x] **Step 2: Create AuthGate component**

Wraps screens that require auth. Shows login prompt modal (per [feature-design.md §3.4](feature-design.md)) when unauthenticated user tries a protected action.

- [x] **Step 3: Test routing logic, commit**

```bash
git commit -m "feat: add auth routing and AuthGate for protected actions"
```

#### Task 3.4: Onboarding screens

**Files:**

- Create: `app/(onboarding)/_layout.tsx`
- Create: `app/(onboarding)/profile.tsx`
- Create: `app/(onboarding)/location.tsx`
- Create: `src/features/onboarding/hooks/useOnboardingStatus.ts`
- Create: `src/i18n/en/onboarding.json`
- Test: `app/(onboarding)/__tests__/profile.test.tsx`
- Test: `app/(onboarding)/__tests__/location.test.tsx`

- [x] **Step 1: Write tests for profile setup screen**

Test: renders progress dots (step 1 of 2). Test: renders photo upload area. Test: renders display name input (pre-filled from OAuth if available). Test: "Skip for now" navigates forward. Test: "Continue" saves profile and navigates to step 2.

- [x] **Step 2: Implement profile setup screen**

Per [feature-design.md §3.2](feature-design.md). Progress dots, circular photo upload placeholder, display name input, skip/continue buttons. Save to `profiles` table via Supabase.

- [x] **Step 3: Write tests for location setup screen**

Test: renders progress dots (step 2 of 2). Test: renders postcode input. Test: renders label input. Test: shows privacy callout. Test: "Done" saves location and navigates to main app.

- [x] **Step 4: Implement location setup screen**

Per [feature-design.md §3.3](feature-design.md). Postcode/ZIP input, private label, privacy callout, area preview (placeholder for now — geocoding added in Phase 5). "Done" saves to `saved_locations` with `is_primary = true`.

- [x] **Step 5: Implement useOnboardingStatus hook**

Checks if profile is complete (has display_name) and has at least one saved location. Used by auth routing to decide whether to show onboarding.

- [x] **Step 6: Add onboarding translations, run tests, commit**

```bash
git commit -m "feat: add onboarding screens (profile setup, location setup)"
```

#### Task 3.5: Unauthenticated experience (local inventory)

**Files:**

- Create: `src/features/auth/hooks/useLocalInventory.ts`
- Create: `src/features/auth/utils/localStorage.ts`
- Test: `src/features/auth/__tests__/useLocalInventory.test.ts`

- [x] **Step 1: Write test for local inventory storage**

Test: saves items to AsyncStorage. Test: loads items from AsyncStorage. Test: items persist across hook re-renders.

- [x] **Step 2: Implement useLocalInventory hook**

Stores items in AsyncStorage as JSON array. Used when user is not authenticated. On sign-in, items are uploaded to Supabase and local storage is cleared (implemented in Phase 4 when inventory CRUD exists).

- [x] **Step 3: Implement sync banner component**

Yellow warning banner: "Your items are saved on this device only. Sign in to sync and share them." per [feature-design.md §3.4](feature-design.md).

- [x] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add local inventory for unauthenticated users"
```

---

## Chunk 3: Inventory (Phase 4)

### Phase 4: Inventory (Items)

**Goal:** Users can add, edit, delete items with photos. Item list with category filters. Item detail with full information.

#### Task 4.1: Inventory types and utils

**Files:**

- Create: `src/features/inventory/types.ts`
- Create: `src/features/inventory/utils/status.ts`
- Create: `src/features/inventory/utils/validation.ts`
- Test: `src/features/inventory/utils/__tests__/status.test.ts`
- Test: `src/features/inventory/utils/__tests__/validation.test.ts`

- [ ] **Step 1: Write tests for item status utils**

Test: `canDelete(item)` — returns true for Stored/Mounted/Donated/Sold/Archived, false for Loaned/Reserved. Test: `canEditAvailability(item)` — returns false for Loaned/Reserved. Test: `getStatusColor(status)` — returns correct color tokens.

- [ ] **Step 2: Implement status utils**

Pure functions operating on `Item` type. No side effects.

- [ ] **Step 3: Write tests for validation**

Test: `validateItem(data)` — name required, category required, condition required. Returns errors object.

- [ ] **Step 4: Implement validation utils, commit**

```bash
git commit -m "feat: add inventory status and validation utils"
```

#### Task 4.2: Inventory TanStack Query hooks

**Files:**

- Create: `src/features/inventory/hooks/useItems.ts`
- Create: `src/features/inventory/hooks/useItem.ts`
- Create: `src/features/inventory/hooks/useCreateItem.ts`
- Create: `src/features/inventory/hooks/useUpdateItem.ts`
- Create: `src/features/inventory/hooks/useDeleteItem.ts`
- Test: `src/features/inventory/hooks/__tests__/useItems.test.ts`

- [ ] **Step 1: Write test for useItems hook**

Test: fetches items for current user via Supabase. Test: returns loading state. Test: returns items array on success.

- [ ] **Step 2: Implement query and mutation hooks**

`useItems()` — `useQuery(['items', userId], ...)` fetching from Supabase `items` table where `owner_id = userId`, ordered by `updated_at desc`. Include related `item_photos` and `saved_locations`.

`useItem(id)` — single item detail.

`useCreateItem()` — `useMutation` inserting into `items`. Invalidates `['items']` on success.

`useUpdateItem()` — `useMutation` updating `items` by id. Invalidates `['items']` and `['items', id]`.

`useDeleteItem()` — `useMutation` deleting from `items` (checks `canDelete` first). Invalidates `['items']`.

- [ ] **Step 3: Run tests, commit**

```bash
git commit -m "feat: add inventory TanStack Query hooks (CRUD)"
```

#### Task 4.3: Item list screen

**Files:**

- Modify: `app/(tabs)/inventory/index.tsx`
- Create: `src/features/inventory/components/ItemCard/ItemCard.tsx`
- Create: `src/features/inventory/components/CategoryFilter/CategoryFilter.tsx`
- Create: `src/i18n/en/inventory.json`
- Test: `src/features/inventory/components/ItemCard/__tests__/ItemCard.test.tsx`
- Story: `src/features/inventory/components/ItemCard/ItemCard.stories.tsx`

- [ ] **Step 1: Write test for ItemCard**

Test: renders item name, category, condition. Test: renders primary photo thumbnail or placeholder. Test: renders availability chips. Test: renders status badge with correct color. Test: fires onPress.

- [ ] **Step 2: Implement ItemCard component**

Per [feature-design.md §3.5](feature-design.md). Photo thumbnail (80×60), name, category + condition, availability chips (colored), status badge. Uses Paper components + theme tokens.

- [ ] **Step 3: Create Storybook story for ItemCard**

Show all statuses (Stored, Mounted, Loaned, Reserved, Donated, Sold, Archived) and availability combinations.

- [ ] **Step 4: Implement CategoryFilter chip row**

Horizontal scrollable chips: All / Components / Tools / Accessories. Active chip uses `primaryContainer` color.

- [ ] **Step 5: Implement item list screen**

Screen uses `useItems()` hook. Shows header ("Inventory" + "Bikes →" link), `CategoryFilter`, `FlatList` of `ItemCard`s, FAB for add. Empty state when no items. Pull-to-refresh. For unauthenticated: shows sync banner + local items.

- [ ] **Step 6: Add inventory translations, run tests, commit**

```bash
git commit -m "feat: add item list screen with category filters"
```

#### Task 4.4: Add/Edit item form

**Files:**

- Create: `app/(tabs)/inventory/new.tsx`
- Create: `app/(tabs)/inventory/edit/[id].tsx`
- Create: `src/features/inventory/components/ItemForm/ItemForm.tsx`
- Test: `src/features/inventory/components/ItemForm/__tests__/ItemForm.test.tsx`

- [ ] **Step 1: Write tests for ItemForm**

Test: renders all required fields (name, category, condition). Test: category chip selector is single-select. Test: condition chip selector is single-select. Test: availability checkboxes are multi-select. Test: Private deselects others. Test: Sellable reveals price input. Test: Borrowable reveals deposit/duration. Test: validation shows errors for missing required fields. Test: submit calls onSave with form data.

- [ ] **Step 2: Implement ItemForm component**

Per [feature-design.md §3.7](feature-design.md). Scrollable form with: photo upload section (up to 5), name input, category chips, brand/model inputs, condition chips, availability checkboxes, borrow options (conditional), price (conditional), pickup location picker (defaults to primary), visibility picker, collapsible optional section (age, km, purchase date, storage, description). Save button. In edit mode: pre-filled, delete button at bottom.

- [ ] **Step 3: Wire up add screen and edit screen**

`new.tsx` uses `useCreateItem()`. `edit/[id].tsx` loads item via `useItem(id)` and uses `useUpdateItem()`.

- [ ] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add item creation and editing form"
```

#### Task 4.5: Item detail screen

**Files:**

- Create: `app/(tabs)/inventory/[id].tsx`
- Create: `src/features/inventory/components/ItemDetail/ItemDetail.tsx`
- Create: `src/features/inventory/components/PhotoGallery/PhotoGallery.tsx`
- Test: `src/features/inventory/components/ItemDetail/__tests__/ItemDetail.test.tsx`

- [ ] **Step 1: Write tests for ItemDetail**

Test: renders photo gallery. Test: renders name, status badge, category/brand/model. Test: renders availability chips with price. Test: renders detail grid (condition, age, usage, storage). Test: renders pickup area. Test: shows "Mark as Donated/Sold" when status allows. Test: shows "Mark as Returned" when Loaned. Test: hides actions when status doesn't allow.

- [ ] **Step 2: Implement PhotoGallery (swipeable carousel)**

Horizontal `FlatList` / `ScrollView` with paging. Dot indicator. Tap to open fullscreen modal. Placeholder when no photos.

- [ ] **Step 3: Implement ItemDetail**

Per [feature-design.md §3.6](feature-design.md). Photo gallery at top, title + status, availability chips, detail grid, pickup area, notes, visibility, action buttons. Status changes use `useUpdateItemStatus` / exchange hooks as appropriate; **Remove from inventory** uses `RemoveFromInventoryDialog`; unarchive uses `useUpdateItemStatus` → `stored`.

- [ ] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add item detail screen with photo gallery"
```

#### Task 4.6: Photo upload

**Files:**

- Create: `src/features/inventory/hooks/usePhotoUpload.ts`
- Create: `src/features/inventory/components/PhotoPicker/PhotoPicker.tsx`
- Test: `src/features/inventory/hooks/__tests__/usePhotoUpload.test.ts`

- [ ] **Step 1: Write test for usePhotoUpload**

Test: compresses image before upload. Test: uploads to Supabase Storage. Test: returns storage path. Test: respects 5-photo limit.

- [ ] **Step 2: Implement usePhotoUpload**

Uses `expo-image-picker` for camera/gallery selection. `compressImageForMobileUpload` (`expo-image-manipulator` + size check via `expo-file-system/legacy`, target ≤512 KB). Uploads to Supabase Storage bucket `items/{userId}/{itemId}/`. Creates `item_photos` row. Returns storage path.

- [ ] **Step 3: Implement PhotoPicker component**

Grid of photo thumbnails (up to 5) with "+" add button. Drag to reorder (or long-press menu to set as primary). Delete individual photos.

- [ ] **Step 4: Integrate into ItemForm, run tests, commit**

```bash
git commit -m "feat: add photo upload with compression and reordering"
```

---

#### Task 4.7: E2E tests for inventory

**Files:**

- Create: `e2e/inventory.yaml`

- [ ] **Step 1: Write Maestro E2E test for add item flow**

Test: user navigates to Inventory tab → taps FAB → fills name, selects category, selects condition → saves → item appears in list.

- [ ] **Step 2: Write Maestro E2E test for item detail**

Test: user taps an item → detail screen shows name, status, availability.

- [ ] **Step 3: Run E2E, commit**

```bash
npm run test:e2e
git commit -m "test: add Maestro E2E tests for inventory flows"
```

---

## Chunk 4: Locations + Search (Phases 5–6)

### Phase 5: Locations

**Goal:** Users can manage saved locations with geocoding. Primary location used for search.

#### Task 5.1: Locations feature

**Files:**

- Create: `src/features/locations/hooks/useLocations.ts`
- Create: `src/features/locations/hooks/useCreateLocation.ts`
- Create: `src/features/locations/hooks/useUpdateLocation.ts`
- Create: `src/features/locations/hooks/useDeleteLocation.ts`
- Create: `src/features/locations/hooks/usePrimaryLocation.ts`
- Create: `src/features/locations/utils/geocoding.ts`
- Create: `src/features/locations/index.ts`
- Create: `src/i18n/en/locations.json`
- Test: `src/features/locations/hooks/__tests__/useLocations.test.ts`
- Test: `src/features/locations/utils/__tests__/geocoding.test.ts`

- [ ] **Step 1: Write tests for geocoding util**

Test: `geocodePostcode(postcode, country?)` returns area name + coordinates. Test: handles invalid postcode gracefully.

- [ ] **Step 2: Create geocode-postcode Edge Function**

```bash
supabase functions new geocode-postcode
```

Edge Function calls Nominatim API (max 1 req/sec), caches results in a `geocode_cache` table. Client calls the Edge Function, not Nominatim directly. Returns `{ areaName, lat, lng }`.

- [ ] **Step 3: Create geocode_cache migration**

```sql
-- supabase/migrations/00006_geocode_cache.sql
CREATE TABLE geocode_cache (
  postcode TEXT PRIMARY KEY,
  area_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now()
);
```

- [ ] **Step 4: Implement client-side geocoding util**

`geocoding.ts` — calls the `geocode-postcode` Edge Function via Supabase `functions.invoke()`. Returns `{ areaName, lat, lng }`. No direct Nominatim calls from client.

- [ ] **Step 3: Implement location CRUD hooks**

`useLocations()` — fetch user's saved locations. `useCreateLocation()` — geocode postcode, save with coordinates. `useUpdateLocation()` — update label/postcode, re-geocode if changed. `useDeleteLocation()` — blocked if only location or items reference it. `usePrimaryLocation()` — returns the location with `is_primary = true`.

- [ ] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add location management with geocoding"
```

#### Task 5.2: Saved locations screen

**Files:**

- Create: `app/(tabs)/profile/locations.tsx`
- Create: `src/features/locations/components/LocationCard/LocationCard.tsx`
- Create: `src/features/locations/components/LocationForm/LocationForm.tsx`
- Test: `src/features/locations/components/__tests__/LocationCard.test.tsx`

- [ ] **Step 1: Implement LocationCard and LocationForm**

Per [feature-design.md §3.17](feature-design.md). LocationCard shows label, area name, postcode, primary badge. LocationForm: postcode input, label input, "Set as primary" toggle, area preview after geocoding.

- [ ] **Step 2: Implement saved locations screen**

List of LocationCards + "Add location" dashed card. Tap card → edit form (bottom sheet or push screen).

- [ ] **Step 3: Update onboarding location screen to use geocoding**

Wire up the onboarding location screen to actually geocode the postcode and show the area preview.

- [ ] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add saved locations screen with geocoding integration"
```

### Phase 6: Search & Discovery

**Goal:** Users can search for nearby items, filter results, and view listing details.

#### Task 6.1: Search hooks

**Files:**

- Create: `src/features/search/hooks/useSearchItems.ts`
- Create: `src/features/search/hooks/useSearchFilters.ts`
- Create: `src/features/search/types.ts`
- Create: `src/features/search/index.ts`
- Test: `src/features/search/hooks/__tests__/useSearchItems.test.ts`

- [ ] **Step 1: Define search filter types**

```typescript
interface SearchFilters {
  query: string;
  maxDistanceKm: number;
  categories: ItemCategory[];
  conditions: ItemCondition[];
  offerTypes: AvailabilityType[];
  priceMin?: number;
  priceMax?: number;
  groupId?: GroupId;
  sortBy: 'distance' | 'newest' | 'recently_available';
}
```

- [ ] **Step 2: Implement useSearchFilters (client state)**

React Context for managing search filter state. Default: 25 km radius, no category/condition filters, sort by distance.

- [ ] **Step 3: Implement useSearchItems**

TanStack Query hook calling `search_nearby_items` RPC with filters + user's primary location coordinates. Returns items with distance calculated.

- [ ] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add search hooks with distance-based filtering"
```

#### Task 6.2: Search screens

**Files:**

- Modify: `app/(tabs)/search/index.tsx`
- Create: `app/(tabs)/search/[id].tsx` (listing detail)
- Create: `src/features/search/components/SearchBar/SearchBar.tsx`
- Create: `src/features/search/components/SearchResultCard/SearchResultCard.tsx`
- Create: `src/features/search/components/FilterSheet/FilterSheet.tsx`
- Create: `src/features/search/components/ListingDetail/ListingDetail.tsx`
- Create: `src/i18n/en/search.json`
- Test: `src/features/search/components/__tests__/SearchResultCard.test.tsx`
- Test: `src/features/search/components/__tests__/ListingDetail.test.tsx`

- [ ] **Step 1: Implement SearchBar, SearchResultCard, FilterSheet**

Per [feature-design.md §3.9–3.11](feature-design.md). SearchBar with location line + distance dropdown. SearchResultCard: photo, name, condition, owner name, availability chips, area + distance. FilterSheet: bottom sheet with category, condition, offer type, price range, group filter chips.

- [ ] **Step 2: Implement search index screen**

Empty state with search prompt. On submit: show results via `useSearchItems()`. Quick filter chips (Borrow/Donate/Sell). Result count + sort indicator.

- [ ] **Step 3: Implement listing detail screen**

Per [feature-design.md §3.12](feature-design.md). Photo gallery, item info, owner card (avatar, name, rating), location + distance, description, detail grid. Action buttons: "Contact" (→ messaging, Phase 7) and "Request Borrow" (→ borrow, Phase 8). Buttons disabled with "Coming soon" until those features are built. "Report" action in header.

- [ ] **Step 4: Write tests for SearchResultCard and ListingDetail**

- [ ] **Step 5: Add search translations, run tests, commit**

```bash
git commit -m "feat: add search screens with filters and listing detail"
```

---

#### Task 6.3: E2E tests for search

**Files:**

- Create: `e2e/search.yaml`

- [ ] **Step 1: Write Maestro E2E test for search flow**

Test: user navigates to Search tab → types query → submits → results appear with distance.

- [ ] **Step 2: Write Maestro E2E test for listing detail**

Test: user taps a search result → listing detail shows item info, owner card, action buttons.

- [ ] **Step 3: Run E2E, commit**

```bash
git commit -m "test: add Maestro E2E tests for search flows"
```

---

## Chunk 5: Messaging + Borrow + Exchange (Phases 7–9)

### Phase 7: Messaging

**Goal:** Item-linked conversations with realtime chat.

#### Task 7.1: Messaging hooks

**Files:**

- Create: `src/features/messaging/hooks/useConversations.ts`
- Create: `src/features/messaging/hooks/useConversation.ts`
- Create: `src/features/messaging/hooks/useMessages.ts`
- Create: `src/features/messaging/hooks/useSendMessage.ts`
- Create: `src/features/messaging/hooks/useCreateConversation.ts`
- Create: `src/features/messaging/hooks/useRealtimeMessages.ts`
- Create: `src/features/messaging/index.ts`
- Test: `src/features/messaging/hooks/__tests__/useMessages.test.ts`

- [ ] **Step 1: Implement conversation and message hooks**

`useConversations()` — list user's conversations with last message, other participant, linked item info. Ordered by last message timestamp.

`useMessages(conversationId)` — paginated messages for a conversation.

`useSendMessage()` — mutation to insert message.

`useCreateConversation(itemId, participantId)` — creates conversation + adds both participants. Returns existing conversation if one already exists for this item + participant pair.

- [ ] **Step 2: Implement useRealtimeMessages**

Subscribe to Supabase Realtime (`postgres_changes` on `messages` table, filtered by `conversation_id`). On new message, update TanStack Query cache directly (no refetch needed).

- [ ] **Step 3: Run tests, commit**

```bash
git commit -m "feat: add messaging hooks with realtime subscription"
```

#### Task 7.2: Messaging screens

**Files:**

- Modify: `app/(tabs)/messages/index.tsx`
- Create: `app/(tabs)/messages/[id].tsx`
- Create: `src/features/messaging/components/ConversationCard/ConversationCard.tsx`
- Create: `src/features/messaging/components/ChatBubble/ChatBubble.tsx`
- Create: `src/features/messaging/components/ItemReferenceCard/ItemReferenceCard.tsx`
- Create: `src/i18n/en/messages.json`
- Test: `src/features/messaging/components/__tests__/ConversationCard.test.tsx`
- Test: `src/features/messaging/components/__tests__/ChatBubble.test.tsx`

- [ ] **Step 1: Implement ConversationCard, ChatBubble, ItemReferenceCard**

Per [feature-design.md §3.13–3.14](feature-design.md). ConversationCard: avatar (unread dot), name, item name, last message, timestamp. ChatBubble: outgoing (teal right), incoming (gray left), timestamp. ItemReferenceCard: thumbnail, name, availability, "View →".

- [ ] **Step 2: Implement conversation list screen**

FlatList of ConversationCards. Completed transactions shown dimmed. Empty state.

- [ ] **Step 3: Implement conversation detail screen**

Header with user + item name. Pinned ItemReferenceCard. FlatList of ChatBubbles (inverted, newest at bottom). Input bar with send button. Realtime updates via `useRealtimeMessages`.

- [ ] **Step 4: Wire "Contact" button on listing detail**

Listing detail "Contact" button → `useCreateConversation()` → navigate to conversation.

- [ ] **Step 5: Add messages translations, run tests, commit**

```bash
git commit -m "feat: add messaging screens with realtime chat"
```

#### Task 7.3: Unread badge on Messages tab

**Files:**

- Create: `src/features/messaging/hooks/useUnreadCount.ts`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Implement useUnreadCount**

Query unread message count. Subscribe to realtime for updates.

- [ ] **Step 2: Add badge to Messages tab icon**

Show teal badge with count on Messages tab when unread > 0.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add unread message badge on Messages tab"
```

### Phase 8: Borrow Workflow

**Goal:** Formal borrow request/accept/reject/return flow.

#### Task 8.1: Borrow hooks and utils

**Files:**

- Create: `src/features/borrow/hooks/useBorrowRequests.ts`
- Create: `src/features/borrow/hooks/useCreateBorrowRequest.ts`
- Create: `src/features/borrow/hooks/useAcceptBorrowRequest.ts`
- Create: `src/features/borrow/hooks/useDeclineBorrowRequest.ts`
- Create: `src/features/borrow/hooks/useMarkReturned.ts`
- Create: `src/features/borrow/hooks/useCancelBorrowRequest.ts`
- Create: `src/features/borrow/utils/borrowWorkflow.ts`
- Create: `src/features/borrow/index.ts`
- Test: `src/features/borrow/utils/__tests__/borrowWorkflow.test.ts`

- [ ] **Step 1: Write tests for borrow workflow utils**

Test: `canRequestBorrow(item)` — true if Borrowable + Stored. Test: `canAcceptRequest(request, userId)` — true if pending + user is item owner. Test: `canMarkReturned(request, item)` — true if item is Loaned.

- [ ] **Step 2: Implement borrow utils and hooks**

Request flow: create request → item status to Reserved → owner notified. Accept: item status to Loaned → conversation created → requester notified. Decline: item status back to Stored → requester notified. Return: item status to Stored → rating prompt triggered. Cancel: item status back to Stored.

- [ ] **Step 3: Run tests, commit**

```bash
git commit -m "feat: add borrow workflow hooks and utils"
```

#### Task 8.2: Borrow request screens

**Files:**

- Create: `app/(tabs)/profile/borrow-requests.tsx`
- Create: `src/features/borrow/components/BorrowRequestCard/BorrowRequestCard.tsx`
- Create: `src/i18n/en/borrow.json`
- Test: `src/features/borrow/components/__tests__/BorrowRequestCard.test.tsx`

- [ ] **Step 1: Implement BorrowRequestCard**

Shows requester/owner info, item name, request time, action buttons (Accept/Decline for incoming; Cancel for outgoing; Mark Returned for active).

- [ ] **Step 2: Implement borrow requests screen**

Per [feature-design.md §3.16](feature-design.md). Three sub-tabs: Incoming (with count) / Outgoing / Active. Linked from Profile menu.

- [ ] **Step 3: Wire "Request Borrow" on listing detail**

Listing detail "Request Borrow" button → confirmation → `useCreateBorrowRequest()` → navigate to outgoing tab.

- [ ] **Step 4: Add borrow translations, run tests, commit**

```bash
git commit -m "feat: add borrow request screens and workflow"
```

### Phase 9: Donate & Sell

**Goal:** Mark items as donated/sold from conversation and item detail.

#### Task 9.1: Exchange actions

**Files:**

- Create: `src/features/exchange/hooks/useMarkDonated.ts`
- Create: `src/features/exchange/hooks/useMarkSold.ts`
- Create: `src/features/exchange/index.ts`
- Test: `src/features/exchange/hooks/__tests__/useMarkDonated.test.ts`

- [ ] **Step 1: Implement mark as donated/sold hooks**

`useMarkDonated(itemId)` — updates item status to 'donated'. `useMarkSold(itemId)` — updates item status to 'sold'. Both invalidate item queries and trigger rating window (set `editable_until` to 14 days from now on both parties).

- [ ] **Step 2: Wire into item detail and conversation**

Add "Mark as Donated" / "Mark as Sold" action buttons on item detail (Phase 4 screen) and conversation header menu. Both show confirmation dialog.

- [ ] **Step 3: Run tests, commit**

```bash
git commit -m "feat: add donate/sell status actions with confirmation"
```

---

#### Task 9.2: E2E tests for messaging and borrow

**Files:**

- Create: `e2e/messaging.yaml`
- Create: `e2e/borrow.yaml`

- [ ] **Step 1: Write Maestro E2E test for messaging**

Test: user contacts a listing owner → conversation created → message sent and received.

- [ ] **Step 2: Write Maestro E2E test for borrow workflow**

Test: user requests borrow → owner accepts → item status changes to Loaned → owner marks returned.

- [ ] **Step 3: Run E2E, commit**

```bash
git commit -m "test: add Maestro E2E tests for messaging and borrow"
```

---

## Chunk 6: Bikes + Groups + Ratings (Phases 10–12)

### Phase 10: Bikes

**Goal:** Bike management with mounted parts tracking.

#### Task 10.1: Bike CRUD and mounted parts

**Files:**

- Create: `src/features/bikes/hooks/useBikes.ts`
- Create: `src/features/bikes/hooks/useCreateBike.ts`
- Create: `src/features/bikes/hooks/useAttachPart.ts`
- Create: `src/features/bikes/hooks/useDetachPart.ts`
- Create: `src/features/bikes/components/BikeCard/BikeCard.tsx`
- Create: `src/features/bikes/components/BikeForm/BikeForm.tsx`
- Create: `src/features/bikes/components/MountedParts/MountedParts.tsx`
- Create: `src/features/bikes/index.ts`
- Create: `app/(tabs)/bikes/index.tsx`
- Create: `app/(tabs)/bikes/[id].tsx`
- Create: `app/(tabs)/bikes/new.tsx`
- Create: `app/(tabs)/bikes/edit/[id].tsx`
- Create: `src/i18n/en/bikes.json`
- Test: `src/features/bikes/hooks/__tests__/useAttachPart.test.ts`
- Test: `src/features/bikes/components/__tests__/MountedParts.test.tsx`

- [ ] **Step 1: Implement bike CRUD hooks**

`useBikes()`, `useCreateBike()`, `useUpdateBike()`, `useDeleteBike()`.

- [ ] **Step 2: Implement attach/detach part hooks**

`useAttachPart(bikeId, itemId)` — sets `item.bike_id = bikeId` and `item.status = 'mounted'`. `useDetachPart(itemId)` — clears `bike_id`, sets status to 'stored'. Both invalidate bike and item queries.

- [ ] **Step 3: Implement bike screens**

Per [feature-design.md §3.8](feature-design.md). Bike list (simple cards), bike detail (info + mounted parts list with detach, "Attach part" picker showing Stored items), add/edit bike form (name, brand, model, type, year).

- [ ] **Step 4: Add bikes translations, run tests, commit**

```bash
git commit -m "feat: add bike management with mounted parts"
```

### Phase 11: Groups

**Goal:** Group CRUD, membership, group-scoped item visibility.

#### Task 11.1: Groups feature

**Files:**

- Create: `src/features/groups/hooks/useGroups.ts`
- Create: `src/features/groups/hooks/useGroup.ts`
- Create: `src/features/groups/hooks/useCreateGroup.ts`
- Create: `src/features/groups/hooks/useGroupMembers.ts`
- Create: `src/features/groups/hooks/useJoinGroup.ts`
- Create: `src/features/groups/hooks/useInviteMember.ts`
- Create: `src/features/groups/hooks/useSearchGroups.ts`
- Create: `src/features/groups/utils/groupPermissions.ts`
- Create: `src/features/groups/index.ts`
- Create: `app/(tabs)/profile/groups/index.tsx`
- Create: `app/(tabs)/profile/groups/[id].tsx`
- Create: `src/i18n/en/groups.json`
- Test: `src/features/groups/utils/__tests__/groupPermissions.test.ts`
- Test: `src/features/groups/hooks/__tests__/useGroups.test.ts`

- [ ] **Step 1: Write tests for group permissions**

Test: `canInvite(member)` — true if admin. Test: `canRemoveMember(actor, target)` — true if actor is admin and target is not last admin. Test: `canEditGroup(member)` — true if admin.

- [ ] **Step 2: Implement group hooks**

CRUD hooks + membership management. `useSearchGroups(query)` — search public groups. `useJoinGroup(groupId)` — request to join (status pending for public, direct for invited). `useInviteMember(groupId, userId)` — admin-only.

- [ ] **Step 3: Implement group screens**

Per [feature-design.md §3.18](feature-design.md). My groups list, public group search, create group form, group detail (members, invite, settings).

- [ ] **Step 4: Wire group visibility into item form**

Update ItemForm "Visible to → Groups..." to show multi-select of user's groups. Save selected groups to `item_groups` junction table.

- [ ] **Step 5: Add groups translations, run tests, commit**

```bash
git commit -m "feat: add groups with membership and item visibility scoping"
```

### Phase 12: Ratings & Reviews

**Goal:** Post-transaction ratings, public user profile with reviews.

#### Task 12.1: Ratings feature

**Files:**

- Create: `src/features/ratings/hooks/useCreateRating.ts`
- Create: `src/features/ratings/hooks/useUserRatings.ts`
- Create: `src/features/ratings/hooks/useUpdateRating.ts`
- Create: `src/features/ratings/hooks/useDeleteRating.ts`
- Create: `src/features/ratings/components/RatingPrompt/RatingPrompt.tsx`
- Create: `src/features/ratings/components/ReviewCard/ReviewCard.tsx`
- Create: `src/features/ratings/utils/ratingWindow.ts`
- Create: `src/features/ratings/index.ts`
- Create: `src/i18n/en/ratings.json`
- Test: `src/features/ratings/utils/__tests__/ratingWindow.test.ts`
- Test: `src/features/ratings/components/__tests__/RatingPrompt.test.tsx`

- [ ] **Step 1: Write tests for rating window utils**

Test: `isWithinRatingWindow(rating)` — true if `editable_until` is in the future. Test: `canEditRating(rating)` — true if within window. Test: `canDeleteRating(rating, userId)` — true if user is author (anytime).

- [ ] **Step 2: Implement rating hooks**

`useCreateRating()` — create with score (1-5) + optional text + `editable_until` set to 14 days. `useUpdateRating()` — only within window. `useDeleteRating()` — anytime by author. `useUserRatings(userId)` — fetch ratings for a user's public profile.

- [ ] **Step 3: Implement RatingPrompt (bottom sheet)**

Per [feature-design.md §3.22](feature-design.md). Star selector, optional comment, skip/submit, 14-day note. Triggered after borrow return or donate/sell completion.

- [ ] **Step 4: Implement public user profile screen**

Per [feature-design.md §3.19](feature-design.md). Avatar, display name, rating average, recent reviews (ReviewCard), public listings.

- [ ] **Step 5: Create profile screen route and wire navigation**

`app/(tabs)/profile/[userId].tsx` — loads other user's public profile. Linked from listing detail owner card, conversation header, search result usernames.

- [ ] **Step 6: Add ratings translations, run tests, commit**

```bash
git commit -m "feat: add ratings, reviews, and public user profile"
```

---

## Chunk 7: Notifications + Profile + CI (Phases 13–14)

### Phase 13: Notifications

**Goal:** In-app notification center, push notifications (native), email notifications.

#### Task 13.1: In-app notifications

**Files:**

- Create: `src/features/notifications/hooks/useNotifications.ts`
- Create: `src/features/notifications/hooks/useMarkNotificationRead.ts`
- Create: `src/features/notifications/hooks/useUnreadNotificationCount.ts`
- Create: `src/features/notifications/hooks/useRealtimeNotifications.ts`
- Create: `src/features/notifications/components/NotificationCard/NotificationCard.tsx`
- Create: `src/features/notifications/components/NotificationBell/NotificationBell.tsx`
- Create: `app/(tabs)/inventory/notifications.tsx`
- Create: `src/features/notifications/index.ts`
- Create: `src/i18n/en/notifications.json`
- Test: `src/features/notifications/hooks/__tests__/useNotifications.test.ts`
- Test: `src/features/notifications/components/__tests__/NotificationCard.test.tsx`

- [ ] **Step 1: Implement notification hooks**

`useNotifications()` — fetch user's notifications, ordered by created_at desc. `useMarkNotificationRead(id)` — update `is_read`. `useUnreadNotificationCount()` — count query. `useRealtimeNotifications()` — subscribe to new notifications via Supabase Realtime.

- [ ] **Step 2: Implement NotificationCard and NotificationBell**

NotificationCard: type icon, title, body, timestamp, read/unread styling. NotificationBell: bell icon with unread count badge, placed in Inventory tab header.

- [ ] **Step 3: Implement notifications list screen**

Per [feature-design.md §5](feature-design.md). Reverse-chronological list. Tap → navigate to relevant screen. Mark as read on tap.

- [ ] **Step 4: Add bell icon to Inventory tab header**

- [ ] **Step 5: Run tests, commit**

```bash
git commit -m "feat: add in-app notification center with realtime"
```

#### Task 13.2: Notification settings screen

**Files:**

- Create: `app/(tabs)/profile/notification-settings.tsx`
- Create: `src/features/notifications/hooks/useNotificationPreferences.ts`

- [ ] **Step 1: Implement notification preferences**

Store preferences in `profiles` table (jsonb column `notification_preferences`). Default: all channels on for all categories. `useNotificationPreferences()` — read/update preferences.

- [ ] **Step 2: Implement notification settings screen**

Per [feature-design.md §3.20](feature-design.md). Per-category (Messages, Borrow Activity, Reminders) with push + email toggles.

- [ ] **Step 3: Run tests, commit**

```bash
git commit -m "feat: add notification settings screen"
```

#### Task 13.3: Push notifications (native) + Email (Edge Functions)

**Files:**

- Create: `src/features/notifications/hooks/usePushToken.ts`
- Create: `supabase/functions/send-push-notification/index.ts`
- Create: `supabase/functions/send-notification-email/index.ts`

- [ ] **Step 1: Implement push token registration**

`usePushToken()` — on native, request permissions via `expo-notifications`, get push token, store in `profiles.push_token`. On web, skip.

- [ ] **Step 2: Create send-push-notification Edge Function**

Triggered by database webhook on new notifications. Reads user's push token and notification preferences. Sends via Expo Push API. Respects user preferences (skip if push disabled for this category).

- [ ] **Step 3: Create send-notification-email Edge Function**

Triggered by database webhook. Reads user's email (from auth) and preferences. Sends via Resend API. Respects user preferences.

- [ ] **Step 4: Create database webhooks**

Migrations for DB triggers that call Edge Functions on: new message, new borrow request, request status change, return reminder.

- [ ] **Step 5: Run tests, commit**

```bash
git commit -m "feat: add push notifications and email via Edge Functions"
```

### Phase 14: Profile, Support & Polish

**Goal:** Profile settings, help & support, account deletion, Sentry, CI pipeline.

#### Task 14.1: Profile settings screen

**Files:**

- Modify: `app/(tabs)/profile/index.tsx`
- Create: `src/features/profile/hooks/useProfile.ts`
- Create: `src/features/profile/hooks/useUpdateProfile.ts`
- Create: `src/features/profile/components/ProfileHeader/ProfileHeader.tsx`
- Create: `src/i18n/en/profile.json`
- Test: `src/features/profile/components/__tests__/ProfileHeader.test.tsx`

- [ ] **Step 1: Implement profile hooks and ProfileHeader**

`useProfile()` — fetch own profile. `useUpdateProfile()` — update display name, avatar. ProfileHeader: avatar, name, rating, "Edit" link.

- [ ] **Step 2: Implement full profile settings screen**

Per [feature-design.md §3.15](feature-design.md). Profile header + menu list (Saved Locations, Groups, Borrow Requests with badge, Notification Settings, Appearance picker, Help & Support, About & Legal). Sign Out button.

- [ ] **Step 3: Implement appearance setting**

Inline picker: System / Light / Dark. Store preference in AsyncStorage. Override `useColorScheme()` in root layout.

- [ ] **Step 4: Add profile translations, run tests, commit**

```bash
git commit -m "feat: add profile settings screen with appearance toggle"
```

#### Task 14.2: Help & Support

**Files:**

- Create: `app/(tabs)/profile/support.tsx`
- Create: `src/features/profile/hooks/useSubmitSupport.ts`
- Create: `supabase/functions/notify-support/index.ts`

- [ ] **Step 1: Implement support form screen**

Per [feature-design.md §3.21](feature-design.md). Subject, message, optional screenshot, auto-context. `useSubmitSupport()` — inserts into `support_requests` table. Edge Function emails support team.

- [ ] **Step 2: Add unauthenticated access**

Help link on welcome screen. Simplified form (no user ID, optional email field for follow-up).

- [ ] **Step 3: Run tests, commit**

```bash
git commit -m "feat: add help and support form"
```

#### Task 14.3: Account deletion

**Files:**

- Create: `src/features/profile/hooks/useDeleteAccount.ts`
- Create: `supabase/functions/delete-account/index.ts`

- [ ] **Step 1: Implement account deletion**

Edge Function (requires service role key): deletes items, anonymizes conversations + ratings (set user references to null, display as "[Deleted user]"), deletes profile, deletes auth user. Client-side: confirmation dialog explaining consequences, calls Edge Function, signs out.

- [ ] **Step 2: Run tests, commit**

```bash
git commit -m "feat: add GDPR account deletion with data anonymization"
```

#### Task 14.4: Expand CI pipeline

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add remaining CI jobs**

Expand CI (created in Phase 1) to add: `storybook` (interaction tests), `e2e` (Maestro), `a11y` (accessibility tests), `visual` (non-blocking screenshot comparison), `build` (EAS Build + web export after all blocking jobs). Add `validate:i18n` to lint job. Add Codecov upload. Add SonarCloud integration.

- [ ] **Step 2: Configure source maps upload for Sentry**

Add Sentry source maps upload to EAS Build config.

- [ ] **Step 3: Commit**

```bash
git commit -m "ci: expand CI with storybook, e2e, a11y, visual, and build jobs"
```

#### Task 14.5: Responsive web layout

**Files:**

- Create: `src/shared/components/MaxWidthContainer/MaxWidthContainer.tsx`
- Test: `src/shared/components/MaxWidthContainer/__tests__/MaxWidthContainer.test.tsx`

- [ ] **Step 1: Implement MaxWidthContainer**

Per [technical-specs.md §2 "Responsive layout"](technical-specs.md). Wraps content with `maxWidth: 480` centered on screen. Background uses `surfaceVariant` on desktop. Used in root layout to contain all screen content on web.

- [ ] **Step 2: Run tests, commit**

```bash
git commit -m "feat: add responsive MaxWidthContainer for web"
```

#### Task 14.6: Offline support polish

**Files:**

- Create: `src/shared/hooks/useNetworkStatus.ts`
- Create: `src/shared/hooks/useOfflineQueue.ts`
- Create: `src/shared/components/OfflineBanner/OfflineBanner.tsx`

- [ ] **Step 1: Implement network status hook**

Uses `@react-native-community/netinfo`. Returns `isOnline` boolean.

- [ ] **Step 2: Implement offline queue**

Mutations that fail due to network are stored in AsyncStorage. On reconnect, replay in order. Show "pending sync" indicator on affected items.

- [ ] **Step 3: Implement OfflineBanner**

Shown at top of screen when offline. Dismissible. Per [technical-specs.md §7](technical-specs.md).

- [ ] **Step 4: Run tests, commit**

```bash
git commit -m "feat: add offline support with sync queue and banner"
```

#### Task 14.7: Deep linking

**Files:**

- Modify: `app.json`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Configure Expo Router deep linking**

Set up Universal Links (iOS) / App Links (Android) in `app.json`. Configure deep link handling so push notification taps navigate to the correct screen (conversation, borrow request, etc.).

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: configure deep linking for push notification navigation"
```

#### Task 14.8: Report/moderation flow

**Files:**

- Create: `src/shared/components/ReportDialog/ReportDialog.tsx`
- Create: `src/shared/hooks/useReport.ts`

- [ ] **Step 1: Implement report dialog**

Bottom sheet with reason selector + optional text. Reasons: inappropriate content, spam, stolen goods, misleading condition, other. `useReport()` — inserts into a `reports` table (add migration). Used from listing detail and user profile "Report" buttons.

- [ ] **Step 2: Run tests, commit**

```bash
git commit -m "feat: add report and moderation flow"
```

---

## Execution Notes

### Development order matters

Each phase builds on the previous. Do not skip phases. Within a phase, tasks can sometimes be parallelized (e.g., hooks and components), but the sequence within each task must be followed (test → implement → verify → commit).

### Testing at every step

Every task includes tests. Follow the testing diamond: integration tests for components, unit tests for utils, E2E for critical flows (add Maestro tests for key flows at the end of each chunk).

### Storybook at every step

Every presentational component gets a `.stories.tsx` file. Run Storybook periodically to visually verify components in isolation.

### Translations at every step

Every user-facing string goes through `t()` from day one. Add to the appropriate namespace JSON file.

### Visual verification

After each phase, run the app and visually verify the new screens work correctly on web (and native if possible).

---

_Plan version: 1.0 · Created: 2026-03-18_
