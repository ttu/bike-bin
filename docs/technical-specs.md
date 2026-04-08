# Bike Bin — Technical Specifications

> **Purpose:** How we build it — stack, APIs, data, security, non-functional requirements. Updated as we make technical decisions.  
> **Context:** See [functional-specs.md](functional-specs.md) for product overview, entities, and flows.

---

## 1. Tech stack

| Layer          | Choice                                                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | **Expo** + **React Native** + **React Native Web** + **TypeScript** | iOS, Android, and Web — single codebase. Expo for tooling, OTA, and native builds.                                                                                                                                                                                                                                                                                                                                         |
| Navigation     | **Expo Router**                                                     | File-based routing. 5-tab layout (Inventory, Bikes, Search, Messages, Profile).                                                                                                                                                                                                                                                                                                                                            |
| Server state   | **TanStack Query** (React Query)                                    | Caching, stale-while-revalidate, offline persistence, retry.                                                                                                                                                                                                                                                                                                                                                               |
| Client state   | **React Context API**                                               | Auth session, UI state, filters. Not for server data.                                                                                                                                                                                                                                                                                                                                                                      |
| Offline        | **AsyncStorage** + TanStack Query persister                         | Cache persistence + offline write queue. NetInfo for connectivity detection.                                                                                                                                                                                                                                                                                                                                               |
| Backend        | **Supabase**                                                        | Auth, API (PostgREST), realtime, storage.                                                                                                                                                                                                                                                                                                                                                                                  |
| Data           | **Supabase (PostgreSQL + PostGIS)**                                 | Database, auth users, object storage for photos. PostGIS for geospatial queries.                                                                                                                                                                                                                                                                                                                                           |
| Hosting        | **Supabase** + **Expo EAS** + **EAS Hosting** (web)                 | Backend on Supabase; native builds via EAS; web exported to [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/) — **preview** on each same-repo PR via `deploy-web-preview` in `ci.yml`, **staging** on push to `main` via `.github/workflows/deploy-web-staging.yml`, **production** on version tags via `.github/workflows/deploy-web-production.yml`.                                                        |
| Marketing site | **Astro** (static)                                                  | **https://bikebin.app/** — static landing; source in `sites/marketing/`, deployed via **GitHub Pages** (`.github/workflows/deploy-marketing-pages.yml`). Separate build from the Expo web app (see **Web**).                                                                                                                                                                                                               |
| i18n           | **react-i18next** + **expo-localization**                           | i18n-ready from start; English default. Device locale detection via expo-localization.                                                                                                                                                                                                                                                                                                                                     |
| Push           | **Expo Push Notifications**                                         | Native only (iOS/Android): token management via Expo's push service (APNs/FCM). Web: no push — in-app notifications only (shown on login / while app is open).                                                                                                                                                                                                                                                             |
| Email          | **Resend** (or Postmark) via **Supabase Edge Functions**            | Transactional emails for notifications (new messages, borrow requests, etc.). Supabase built-in email for auth flows.                                                                                                                                                                                                                                                                                                      |
| UI             | **React Native Paper** (Material Design 3)                          | Component library. Custom theme tokens. Light + dark mode from start.                                                                                                                                                                                                                                                                                                                                                      |
| Storybook      | **React Native Storybook** (`@storybook/react-native`)              | Component explorer for isolated development and visual testing.                                                                                                                                                                                                                                                                                                                                                            |
| CI             | **GitHub Actions**                                                  | Lint, type-check, test, coverage, web export, marketing build; **deploy-web-preview** (EAS preview on PRs to `main`); **Deploy web staging** (`eas deploy --alias staging` after CI on `main`); **Deploy web production** (`eas deploy --prod` on `v*` tags); **Deploy marketing site** to GitHub Pages when `sites/marketing/` changes on `main`. Native store builds via EAS Build remain manual or separate automation. |
| Error tracking | **Sentry** (`@sentry/react-native`)                                 | Client-side error tracking, crash reporting, performance monitoring. Free tier (50k errors/month). Initialized in root layout.                                                                                                                                                                                                                                                                                             |

### Supported platforms

| Platform      | Build / Deploy                                                                                      | Release cadence                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Web (app)** | `expo export --platform web` → **EAS Hosting** (production URL from Expo dashboard / custom domain) | **Continuous** — PRs: preview deploy from `ci.yml` after `build`; `main`: staging alias via `deploy-web-staging.yml`; **production**: tag push (`v*`) via `deploy-web-production.yml`. Instant availability on web, no store review. |
| **Marketing** | Astro static site → **https://bikebin.app/** (`sites/marketing/`)                                   | **GitHub Actions** deploys to **GitHub Pages** on changes to `sites/marketing/` on `main`; CI also runs `astro build` in the main pipeline.                                                                                          |
| **iOS**       | **EAS Build** → **App Store** (via EAS Submit)                                                      | Store review required (1–3 days). OTA updates for JS-only changes via EAS Update.                                                                                                                                                    |
| **Android**   | **EAS Build** → **Google Play** (via EAS Submit)                                                    | Store review required (hours–days). OTA updates for JS-only changes via EAS Update.                                                                                                                                                  |

**Web-first advantage:** The web version is continuously deployed, so new features are available immediately. Mobile store releases follow once stable. This means faster iteration cycles and user feedback.

### Platform-specific considerations

| Feature                  | iOS / Android                                              | Web                                                                                                                                |
| ------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Push notifications**   | Expo Push (APNs / FCM)                                     | No push. In-app notifications only (shown when user is logged in / app is open).                                                   |
| **Camera / photos**      | `expo-image-picker` (camera + gallery)                     | `expo-image-picker` (file picker — no direct camera access on most browsers without `getUserMedia`)                                |
| **Image compression**    | `expo-image-manipulator`                                   | `expo-image-manipulator` (web support) or browser-native Canvas API fallback                                                       |
| **Offline / storage**    | AsyncStorage (SQLite-backed)                               | AsyncStorage web adapter (localStorage / IndexedDB). Storage limits vary by browser (~5–10 MB localStorage, larger for IndexedDB). |
| **OAuth (Google/Apple)** | Native OAuth flows via Supabase Auth                       | Redirect-based OAuth flows via Supabase Auth                                                                                       |
| **Deep linking**         | Universal Links (iOS) / App Links (Android)                | Standard URL routing                                                                                                               |
| **Location**             | `expo-location` for device GPS (optional refinement)       | Browser Geolocation API (permission-gated)                                                                                         |
| **Realtime**             | Supabase Realtime (WebSocket)                              | Same — WebSocket works in browsers                                                                                                 |
| **App updates**          | EAS Update (OTA for JS) + store updates for native changes | Instant on deploy — browser loads latest version                                                                                   |

**Design approach:** Build with the shared API surface first. Where platform behavior diverges (push notifications, camera), use `Platform.OS` checks or platform-specific file extensions (`.web.ts`, `.native.ts`) to provide appropriate implementations.

---

## 2. Architecture decisions & patterns

_(Guidance adapted from [emergency-supply-tracker](https://github.com/ttu/emergency-supply-tracker/tree/main/docs).)_

### Project structure

- **Feature slice architecture:** Code organized by feature under `src/features/` (inventory, bikes, borrow, exchange, groups, messaging, search, notifications, ratings, locations, profile, auth, onboarding). See [system-architecture.md](system-architecture.md) for directory layout and public API pattern.
- **Shared code:** `src/shared/` for components, hooks, types, utils, Supabase API layer, and TanStack Query config. Cross-feature logic in shared; feature-specific in the slice.
- **Navigation:** **Expo Router** (file-based routing) under `app/`. 5-tab layout: Inventory, Bikes, Search, Messages, Profile. See [system-architecture.md](system-architecture.md) §3.1 for screen tree.

### State management

- **Server state:** **TanStack Query** (React Query) — fetching, caching, stale-while-revalidate, background refetch, retry, cache invalidation. All Supabase data goes through TanStack Query hooks.
- **Client state:** **React Context API** for UI-only / session state (auth session, active filters, onboarding progress). Not for server-derived data.
- **Offline:** TanStack Query cache persisted to **AsyncStorage** (`@tanstack/query-async-storage-persister`). Offline write queue in AsyncStorage, replayed on reconnect. Network status via `@react-native-community/netinfo`.
- **Rationale:** TanStack Query handles the complexity of server state (caching, deduplication, background sync, retry) that Context alone cannot. Context remains for lightweight client-only state. No Redux needed.

### Business logic

- **Anemic domain models:** Data in TypeScript interfaces; behavior in pure functions in `utils/` (easy to test and serialize).
- **No domain logic in components:** Components call hooks/context actions; calculations live in `shared/utils/` or `features/*/utils/`.

### Incremental, visual-first development

Every implementation step — from project scaffolding onward — must produce **something visible and runnable**. Each subsequent step builds on top of the previous one so progress is always tangible.

- **From step one:** The first commit should render a visible screen (even if it's just a placeholder). No "invisible infrastructure only" steps.
- **Each step adds visible improvement:** Every feature increment should be observable in the running app — a new screen, a new interaction, updated data displayed, etc.
- **Testable at every step:** Each addition must be covered by appropriate tests:
  - **Unit tests** for new business logic and utility functions.
  - **Integration tests** for new components and hooks (React Native Testing Library).
  - **E2E tests** for new user-facing flows.
  - **Visual verification** — the app should be runnable and visually inspectable after every step.
- **No big-bang integration:** Avoid building multiple features in isolation and integrating later. Wire things end-to-end early; iterate on top.

### UI & design system

#### Design philosophy

Minimal, clean, and modern — inspired by Airbnb and Apple apps. Content-first: generous whitespace, restrained color use, clear hierarchy. The app should feel calm and trustworthy, not busy.

#### Component library

**React Native Paper** (Material Design 3). Provides accessible, cross-platform components with built-in theming. MD3 defaults are customized via theme tokens to achieve a cleaner, less "Googley" look (reduced elevation/shadow, rounder corners, subtle surfaces).

#### Color palette

**Primary accent:** Teal / cyan — fresh, modern, outdoorsy.

| Token              | Light mode            | Dark mode             | Usage                                      |
| ------------------ | --------------------- | --------------------- | ------------------------------------------ |
| `primary`          | `#0D9488` (teal-600)  | `#2DD4BF` (teal-400)  | Buttons, links, active tab, FAB, toggles   |
| `onPrimary`        | `#FFFFFF`             | `#042F2E` (teal-950)  | Text/icons on primary-colored surfaces     |
| `primaryContainer` | `#CCFBF1` (teal-100)  | `#134E4A` (teal-900)  | Chips, selected states, subtle highlights  |
| `secondary`        | `#64748B` (slate-500) | `#94A3B8` (slate-400) | Secondary actions, metadata text           |
| `background`       | `#FFFFFF`             | `#0F172A` (slate-900) | Screen background                          |
| `surface`          | `#F8FAFC` (slate-50)  | `#1E293B` (slate-800) | Cards, sheets, elevated surfaces           |
| `surfaceVariant`   | `#F1F5F9` (slate-100) | `#334155` (slate-700) | Input fields, dividers, subtle backgrounds |
| `outline`          | `#CBD5E1` (slate-300) | `#475569` (slate-600) | Borders, dividers                          |
| `error`            | `#DC2626` (red-600)   | `#F87171` (red-400)   | Errors, destructive actions                |
| `success`          | `#16A34A` (green-600) | `#4ADE80` (green-400) | Success states, available indicators       |
| `warning`          | `#D97706` (amber-600) | `#FBBF24` (amber-400) | Warnings, expiring states                  |
| `onBackground`     | `#0F172A` (slate-900) | `#F1F5F9` (slate-100) | Primary text                               |
| `onSurface`        | `#1E293B` (slate-800) | `#E2E8F0` (slate-200) | Text on cards/surfaces                     |
| `onSurfaceVariant` | `#64748B` (slate-500) | `#94A3B8` (slate-400) | Secondary/caption text                     |

Colors sourced from [Tailwind CSS](https://tailwindcss.com/docs/colors) palette for consistency. Defined in `theme.ts` as Paper `MD3LightTheme` / `MD3DarkTheme` overrides.

#### Typography

| MD3 role         | Usage                                      | Size / Weight |
| ---------------- | ------------------------------------------ | ------------- |
| `displayLarge`   | Not used in MVP                            | —             |
| `displayMedium`  | Not used in MVP                            | —             |
| `displaySmall`   | Not used in MVP                            | —             |
| `headlineLarge`  | Screen titles (e.g. "Inventory", "Search") | 28 / 700      |
| `headlineMedium` | Section headers                            | 24 / 600      |
| `headlineSmall`  | Card titles, item names                    | 20 / 600      |
| `titleLarge`     | Dialog titles, large labels                | 20 / 500      |
| `titleMedium`    | List item primary text, tab labels         | 16 / 500      |
| `titleSmall`     | Chip labels, small titles                  | 14 / 500      |
| `bodyLarge`      | Primary body text, messages                | 16 / 400      |
| `bodyMedium`     | Secondary body text, descriptions          | 14 / 400      |
| `bodySmall`      | Captions, timestamps, metadata             | 12 / 400      |
| `labelLarge`     | Button text                                | 14 / 500      |
| `labelMedium`    | Input labels                               | 12 / 500      |
| `labelSmall`     | Badges, tiny labels                        | 11 / 500      |

- **Font family:** System font initially (San Francisco on iOS, Roboto on Android, system sans-serif on web). Custom font TBD — consider Inter or Plus Jakarta Sans for a modern feel.
- **All text via Paper's `<Text>` component** with `variant` prop. No inline font sizes.

#### Spacing & layout

Consistent spacing scale used everywhere. No magic numbers.

| Token  | Value | Common usage                                            |
| ------ | ----- | ------------------------------------------------------- |
| `xs`   | 4px   | Icon padding, tight gaps                                |
| `sm`   | 8px   | Between related elements, chip padding                  |
| `md`   | 12px  | Input padding, list item internal spacing               |
| `base` | 16px  | Card padding, section gaps, standard margin             |
| `lg`   | 24px  | Between sections, modal padding                         |
| `xl`   | 32px  | Screen-level padding (top/bottom), major section breaks |
| `2xl`  | 48px  | Hero spacing, onboarding illustrations                  |

Defined as constants in `theme.ts` (e.g. `spacing.base = 16`). Used via `StyleSheet.create` references.

#### Border radius

| Token  | Value  | Usage                            |
| ------ | ------ | -------------------------------- |
| `sm`   | 8px    | Chips, small buttons, inputs     |
| `md`   | 12px   | Cards, images, modals            |
| `lg`   | 16px   | Bottom sheets, large cards       |
| `full` | 9999px | Avatars, circular buttons, pills |

#### Elevation & shadows

Minimal elevation — prefer subtle borders (`outline` color) over heavy shadows to keep the clean look.

| Level | Usage                 | Style                                             |
| ----- | --------------------- | ------------------------------------------------- |
| 0     | Most content (flat)   | No shadow, optional 1px border                    |
| 1     | Cards, bottom tab bar | Very subtle shadow (`0 1px 3px rgba(0,0,0,0.08)`) |
| 2     | FAB, bottom sheets    | Light shadow (`0 2px 8px rgba(0,0,0,0.12)`)       |
| 3     | Modals, dialogs       | Medium shadow (`0 4px 16px rgba(0,0,0,0.16)`)     |

#### Responsive layout (web)

The web version uses a **max-width container** centered on screen — the app feels like a mobile app on desktop. No multi-column layouts.

| Breakpoint                         | Max content width | Behavior                                                  |
| ---------------------------------- | ----------------- | --------------------------------------------------------- |
| Mobile (< 480px)                   | 100%              | Full-width, standard mobile layout                        |
| Tablet / small desktop (480–768px) | 480px             | Centered container, comfortable reading width             |
| Desktop (> 768px)                  | 480px             | Centered container with background color visible on sides |

- Container centered with `marginHorizontal: 'auto'`.
- Background behind the container uses `surfaceVariant` color for a subtle framing effect on desktop.
- Tab bar and headers contained within the max-width column.

#### Icons

**`@expo/vector-icons`** (MaterialCommunityIcons set) — consistent with Material Design 3. Standard icon sizes:

| Size | Value | Usage                                     |
| ---- | ----- | ----------------------------------------- |
| `sm` | 20px  | Inline with body text, chips, input icons |
| `md` | 24px  | List items, buttons, tab bar (default)    |
| `lg` | 32px  | Empty states, feature icons               |
| `xl` | 48px  | Onboarding illustrations, hero icons      |

#### Light + dark mode

- Supported from day one. Follows device system preference by default; user can override in Profile > Settings.
- Two complete theme objects in `theme.ts` extending Paper's `MD3LightTheme` / `MD3DarkTheme`.
- All components use theme tokens — no hardcoded colors anywhere.
- Test both modes in Storybook and visual regression tests.

#### UI patterns & component usage

**Navigation:**

- **Bottom tab bar:** 5 tabs (Inventory, Bikes, Search, Messages, Profile). Teal active icon + label; `onSurfaceVariant` for inactive. Subtle shadow, minimal elevation.
- **Screen headers:** Paper `Appbar.Header` — left-aligned title, clean background (`surface`), optional right actions.
- **Back navigation:** Arrow icon in header for sub-screens. No hamburger menu.

**Lists:**

- Item lists use Paper `Card` (elevation 1) with image thumbnail on left, title + metadata on right.
- Conversation list: avatar + item thumbnail, last message preview, timestamp.
- Pull-to-refresh on all list screens.

**Cards:**

- `borderRadius: md (12px)`, `elevation: 1`, `padding: base (16px)`.
- Item card: photo (aspect ratio 4:3, `borderRadius: md`), title, condition chip, availability chips, area name, distance.

**Forms & inputs:**

- Paper `TextInput` (outlined mode) — `borderRadius: sm (8px)`, `surfaceVariant` fill.
- Labels above inputs (not floating) for clarity.
- Error text in `error` color below the field.
- Primary button: filled teal. Secondary button: outlined or tonal.

**Chips & badges:**

- Availability types (Borrowable, Donatable, Sellable) as colored chips.
- Condition (New, Good, Fair, Poor) as outlined chips.
- Unread message count as a small teal badge on the Messages tab icon.

**Empty states:**

- Centered illustration icon (`xl` size, `onSurfaceVariant` color), headline, body text, and a primary CTA button.
- Examples: "No items yet — add your first part", "No messages — start a conversation from a listing".

**Loading states:**

- Skeleton placeholders (animated) matching the shape of the content they replace (card, list item, text block).
- No spinners for initial page loads; use skeleton screens instead.
- Inline spinner only for short actions (button submitting, pull-to-refresh).

**Error states:**

- Inline error banner (Paper `Banner` or custom) at the top of the screen for network/server errors.
- Retry button. Dismissible.
- Form field errors shown inline below the field.

**Image display:**

- Item photos: 4:3 aspect ratio in lists, full-width in detail view.
- Placeholder: tinted `surfaceVariant` background with a bicycle icon when no photo.
- Avatar: circular (`borderRadius: full`), 40px in lists, 80px on profile.

**Modals & bottom sheets:**

- Paper `Modal` / `BottomSheet` — `borderRadius: lg (16px)` top corners, `surface` background.
- Used for: filters, confirmations, item quick actions.

**Onboarding:**

- Full-screen pages (no tab bar). Center-aligned content.
- Large icon/illustration at top, headline, body text, primary CTA at bottom.
- Progress indicator (dots or step counter) at top.

#### Accessibility

- Paper components include accessibility props by default (`accessibilityLabel`, `accessibilityRole`).
- Color contrast: WCAG AA minimum (4.5:1 for text, 3:1 for large text/icons). The teal palette meets this against white/dark backgrounds.
- Touch targets: minimum 44x44px (Apple HIG) / 48x48dp (Material).
- Dynamic text sizing: support system font scale. Test at 1.0x and 1.5x.
- Screen reader: all interactive elements have labels. Images have `accessibilityLabel` descriptions.

### When to create a design doc

- Major features, architectural changes, complex business logic, data model changes, cross-cutting concerns.
- Not for: small bug fixes, UI-only changes, minor refactors. See [system-architecture.md](system-architecture.md) §11.

---

## 3. External integrations

| Integration                              | Purpose                                                                         | Auth / constraints                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **OpenStreetMap Nominatim**              | Geocoding — convert postcode/area to coordinates for distance filtering         | Free; respect [usage policy](https://operations.osmfoundation.org/policies/nominatim/) (max 1 req/sec, caching required). No API key needed. |
| **Expo Push Notifications**              | Deliver push notifications to iOS (APNs) and Android (FCM)                      | Via Expo's push service; requires `expo-notifications` and push token registration.                                                          |
| **Resend** (or Postmark)                 | Transactional email delivery (new message notifications, borrow requests, etc.) | API key; called from Supabase Edge Functions.                                                                                                |
| **Supabase Auth (Google + Apple OAuth)** | Social login                                                                    | OAuth client ID/secret configured in Supabase dashboard. Email verified by provider.                                                         |

---

## 4. Data model (core entities)

Core entities (detailed attributes TBD during implementation):

| Entity             | Key fields                                                                                              | Notes                                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**           | id, username, avatar_url, rating_avg, rating_count                                                      | Supabase Auth user + public profile table                                                                                                                                                                                                                                 |
| **SavedLocation**  | id, user_id, label, area_name, coordinates (PostGIS `geography`)                                        | Coordinates for distance queries; only area_name is public                                                                                                                                                                                                                |
| **Item**           | id, owner_id, name, category, brand, model, condition, status, pickup_location_id, availability_types[] | Status enum (stored, mounted, loaned, reserved, donated, sold, archived). Availability is an array (borrowable, donatable, sellable). Item detail: **Remove from inventory** (Paper dialog → archive/delete + confirm); **Restore to inventory** (`archived` → `stored`). |
| **Bike**           | id, owner_id, name, brand, model, type, year                                                            | Parts attached via Item.bike_id                                                                                                                                                                                                                                           |
| **Group**          | id, name, description, is_public                                                                        |                                                                                                                                                                                                                                                                           |
| **GroupMember**    | group_id, user_id, role (admin/member)                                                                  | Creator is first admin                                                                                                                                                                                                                                                    |
| **BorrowRequest**  | id, item_id, requester_id, status (pending/accepted/rejected/returned)                                  | Formal request/accept flow                                                                                                                                                                                                                                                |
| **Conversation**   | id, item_id, participant_ids                                                                            | Always linked to a specific item listing                                                                                                                                                                                                                                  |
| **Message**        | id, conversation_id, sender_id, body, created_at                                                        | Delivered via Supabase Realtime                                                                                                                                                                                                                                           |
| **Rating**         | id, from_user_id, to_user_id, item_id, score (1–5), text                                                | After borrow/donate/sell completion                                                                                                                                                                                                                                       |
| **ItemPhoto**      | id, item_id, storage_path, sort_order                                                                   | References Supabase Storage object                                                                                                                                                                                                                                        |
| **SupportRequest** | id, user_id (nullable), subject, body, screenshot_path, app_version, device_info, status, created_at    | In-app feedback form (§14.1 of functional spec). user_id nullable for unauthenticated submissions.                                                                                                                                                                        |

**Geospatial:**

- Enable **PostGIS** extension on Supabase PostgreSQL.
- `SavedLocation.coordinates` stored as `geography(Point, 4326)`.
- Distance queries use `ST_DWithin(location, user_location, max_distance_meters)` for radius-based search.
- Geocode postcodes via **Nominatim** (server-side, cached) or let users pin on a map.

**Schema documentation:** Maintain a **data schema** doc (e.g. `docs/datamodel.md`) that describes TypeScript types and Supabase tables. **Source of truth:** `src/shared/types/` and Supabase migrations. Use branded types for IDs (e.g. `ItemId`, `UserId`, `SubscriptionId`) for type safety. **Subscriptions** live in the `subscriptions` table (plan, status, period end, optional provider ids); see `docs/datamodel.md` and `docs/security.md` for RLS. _(Pattern from [emergency-supply-tracker DATA_SCHEMA](https://github.com/ttu/emergency-supply-tracker/blob/main/docs/DATA_SCHEMA.md).)_

---

## 5. APIs & contracts

**Primary API:** Supabase **PostgREST** (auto-generated REST API from PostgreSQL schema). No custom REST endpoints needed for most CRUD operations.

**Additional server-side logic via Supabase Edge Functions:**

| Edge Function             | Purpose                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `send-notification-email` | Triggered by database webhook (new message, borrow request); sends email via Resend/Postmark |
| `send-push-notification`  | Triggered by database webhook; sends push via Expo Push API                                  |
| `geocode-postcode`        | Geocode a postcode/area via Nominatim; cache results in DB to respect rate limits            |

**Real-time:**

- **Supabase Realtime** (Postgres Changes) for messaging — client subscribes to new rows in `messages` table filtered by conversation_id.
- Realtime subscriptions also used for: borrow request status changes, new notifications.

**Key operations (via PostgREST):**

- Item CRUD, search with PostGIS distance filter (via RPC / database function for `ST_DWithin`)
- Bike CRUD, attach/detach parts
- Borrow request create/accept/reject/return
- Conversation and message CRUD
- Group CRUD, membership management
- Rating create (after transaction)
- Photo upload (Supabase Storage API)

---

## 6. Security & compliance

> **Full details:** See [security.md](security.md) for the comprehensive security plan (authentication, RLS policies per table, data privacy, encryption, secrets management, input validation, rate limiting, reporting/moderation, GDPR, infrastructure security, and security checklist).

**Summary:**

- **Auth:** Supabase Auth with **Google + Apple OAuth** (social login only). Email verified by provider. Unauthenticated users get read-only access to public listings.
- **Authorization:** **Row Level Security (RLS)** on all tables — users can only modify their own data; conversation/group access scoped to participants/members.
- **Data / PII:** Coordinates stored server-side only (never sent to other clients). Only area_name is public. Email stored in Supabase Auth (not public tables).
- **Image storage:** Supabase Storage with RLS — authenticated upload to own folder; public read for item/bike photos.
- **Compliance:** GDPR — account deletion, data export, consent tracking, retention policies. See [security.md §9](security.md) for details.

---

## 7. Non-functional requirements

| Area               | Requirement                                                                                                                                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance        | Item list and search results load within **1s** on 4G. Messaging delivery under **500ms** (realtime).                                                                                                                                                                                               |
| Availability       | Dependent on Supabase uptime (99.9% SLA on Pro plan). App should handle backend downtime gracefully.                                                                                                                                                                                                |
| Scalability        | Supabase scales with plan tier. PostGIS spatial indexes for efficient distance queries. Image storage via Supabase Storage (S3-backed).                                                                                                                                                             |
| Observability      | Supabase dashboard for DB/API metrics. **Sentry** (`@sentry/react-native`) for client-side error tracking, crash reporting, and performance monitoring.                                                                                                                                             |
| **Offline**        | **Optimistic offline support:** show cached/stale data when offline; queue write operations (item create/edit, messages) and sync when connection returns. Use local storage or AsyncStorage for cache. Clear offline indicator in the UI.                                                          |
| **Images**         | Client-side compression and resize before upload (`expo-image-manipulator` + `expo-file-system` size check). Target ≤512 KB per photo: max width 1024→720 px, JPEG quality 0.65 down to 0.25 until under cap. Supabase Image Transformation for thumbnails (list views). Store in Supabase Storage. |
| **Error handling** | Failed API calls show user-friendly error messages. Retry with exponential backoff for transient failures. Offline queue for write operations (see above).                                                                                                                                          |

---

## 8. Testing strategy

_(Guidance from [emergency-supply-tracker TESTING_STRATEGY](https://github.com/ttu/emergency-supply-tracker/blob/main/docs/TESTING_STRATEGY.md) and [CODE_COVERAGE](https://github.com/ttu/emergency-supply-tracker/blob/main/docs/CODE_COVERAGE.md).)_

### Testing diamond (distribution)

- **~70% Integration tests** — React Native Testing Library; components + hooks + context; best coverage/effort ratio.
- **~20% E2E tests** — Critical user flows (e.g. sign up, add item, request borrow) with Maestro.
- **~10% Unit tests** — Pure business logic in `utils/` (status calculation, workflow transitions, validation).

### Coverage requirements

| Metric     | Threshold (target) — `src/` |
| ---------- | --------------------------- |
| Branches   | 65%                         |
| Functions  | 65%                         |
| Lines      | 65%                         |
| Statements | 65%                         |

`app/` (Expo Router) is included in the coverage report with separate minimums in `jest.config.js` so the `src/` gate stays meaningful.

- **Patch coverage (Codecov):** New/modified code must have ≥80% coverage. Project coverage must not decrease (1% tolerance for fluctuation). Codecov posts PR comments with coverage diffs and sets status checks.
- **Codecov config:** `codecov.yml` in repo root — `target: auto` for project, `target: 80%` for patch, `threshold: 1%`. Exclude `src/test/**` from coverage.
- **Exclude from coverage:** `*.d.ts`, entry point, test helpers, Storybook files, generated Supabase schema types (`src/shared/types/database.ts`) and type-only re-exports (`models.ts`, `rows.ts`).

### Testing patterns

- **Test data factories:** Use factories (e.g. `createMockItem()`, `createMockUser()`) instead of inline objects so mocks stay type-safe and easy to update when types change.
- **Faker.js with seed management:** Use `@faker-js/faker` for random test data generation. Each test run logs the random seed to console (`[Faker] Using seed: 123456`). Reproduce failures with `FAKER_SEED=123456 npm test`. Catches more edge cases than static fixtures; deterministic when debugging.
- **Render with providers:** Centralize a `renderWithProviders(component, options)` that wraps with required Context providers (auth, TanStack QueryClient, etc.) so tests mirror the app.
- **Unit tests:** Only for pure functions; assert inputs → outputs and edge cases.
- **Integration tests:** Assert rendered output and user interactions (clicks, form submit); avoid testing implementation details.
- **E2E:** One spec per critical flow; use real navigation and avoid mocking the backend where possible (or use a test Supabase project).
- **i18n in tests:** Global i18next mock returns translation keys as-is by default. Override with custom translations only when specific rendered text matters.

### Accessibility testing

- **Integration level:** `jest-axe` (or `vitest-axe` equivalent for Jest) — run axe-core checks on rendered components in integration tests. Assert no accessibility violations.
- **E2E level:** `@axe-core/playwright` (or Maestro accessibility assertions) — run full-page accessibility audits on key screens.
- **Target:** WCAG 2.1 Level AA. Ensure sufficient color contrast, screen reader support, dynamic text sizing.
- **CI:** Dedicated `a11y` CI job runs accessibility E2E tests separately from functional E2E.

### Visual regression testing

- **Approach:** Capture screenshots of key screens/states and compare against committed baselines.
- **Baselines:** Committed to the repo (e.g. `e2e/visual-regression-snapshots/`). Separate baselines per platform if rendering differs (macOS vs Linux/CI).
- **Threshold:** Small pixel diff tolerance (e.g. `maxDiffPixels: 50`) to account for anti-aliasing.
- **CI:** Dedicated `visual` CI job. **Non-blocking** — does not gate the build job. Failed diffs uploaded as artifacts for inspection.
- **Updating baselines:** After intentional UI changes, update baselines locally and commit.

### Mutation testing (StrykerJS)

_(Pattern from [emergency-supply-tracker](https://github.com/ttu/emergency-supply-tracker/blob/main/docs/TESTING_STRATEGY.md).)_

- **Purpose:** Verify test quality by introducing small code mutations and checking if tests catch them. Survived mutants = weak tests.
- **Tool:** **StrykerJS** (`@stryker-mutator/core`) with Jest test runner.
- **Scope:** Mutate `src/shared/utils/**/*.ts`, `src/features/**/utils/**/*.ts`, `src/features/**/hooks/**/*.ts`, `src/shared/hooks/**/*.ts`. Exclude test files, type defs, entry points, Storybook files, test utilities.
- **Thresholds:**

| Threshold | Score | Meaning               |
| --------- | ----- | --------------------- |
| High      | 80%   | Target mutation score |
| Low       | 70%   | Warning threshold     |
| Break     | 60%   | Minimum acceptable    |

- **Run locally only** — mutation testing is too slow for CI. Run `npm run test:mutation` periodically to check test quality.
- **Reports:** HTML dashboard (`reports/mutation/html/index.html`) and JSON (`reports/mutation/mutation-report.json`).
- **Improving scores:** Add more assertions, test edge cases and boundary conditions, test error paths, verify return values.

### Storybook

- **Tool:** `@storybook/react-native` — component explorer for isolated development.
- **Purpose:** Develop and visually inspect components in isolation. Document component variants, states, and edge cases. Useful for design review.
- **Stories:** Write `.stories.tsx` files alongside components. Cover all meaningful props/states.
- **Testing:** Storybook interaction tests run in CI as a separate job.
- **CI:** Dedicated `storybook` CI job.

### Tooling & CI

- **Unit + Integration:** **Jest** + **React Native Testing Library** (`@testing-library/react-native`).
- **E2E:** **Maestro** — flow-based mobile testing with YAML specs. Works with Expo Go and development builds. Simpler setup than Detox.
- **Accessibility:** `jest-axe` for integration tests + Maestro/Playwright accessibility checks for E2E.
- **Visual regression:** Screenshot comparison in E2E tests (non-blocking CI).
- **Mutation testing:** StrykerJS — run locally, not in CI.
- **Storybook:** React Native Storybook for component development + Storybook interaction tests in CI.
- **CI:** **GitHub Actions** — parallel jobs for lint, type-check, test, storybook, e2e, a11y, visual (non-blocking), then build. See [system-architecture.md §9](system-architecture.md) for detailed job graph.
- **Pre-commit:** Husky + lint-staged — ESLint (fix) + Prettier on staged files (see §9).

---

## 9. Code quality & conventions

_(From [emergency-supply-tracker CODE_QUALITY](https://github.com/ttu/emergency-supply-tracker/blob/main/docs/CODE_QUALITY.md).)_

### Tools

| Tool        | Purpose                                            | Config                                              |
| ----------- | -------------------------------------------------- | --------------------------------------------------- |
| ESLint      | Linting                                            | `eslint.config.js`                                  |
| Prettier    | Formatting                                         | `.prettierrc`                                       |
| TypeScript  | Type checking                                      | `tsconfig.json` (strict mode)                       |
| Husky       | Git hooks                                          | `.husky/`                                           |
| lint-staged | Pre-commit checks                                  | `package.json`                                      |
| Codecov     | Coverage tracking & PR enforcement                 | `codecov.yml` + GitHub integration                  |
| SonarCloud  | Static analysis, quality gates, tech debt tracking | Configured via SonarCloud website (no local config) |

### External quality services

- **SonarCloud:** Static code analysis on every push/PR. Quality gates enforce no new code smells or security vulnerabilities. Tracks technical debt over time. Test file exclusions configured in SonarCloud UI (`sonar.test.inclusions`, `sonar.cpd.exclusions`). Quality gate status displayed in PRs.
- **Codecov:** Automated coverage tracking. PR comments show coverage diffs. Status checks enforce patch coverage ≥80% and project coverage non-regression. Config in `codecov.yml`.

### Pre-commit

- Run ESLint (fix) + Prettier on staged `.ts`/`.tsx`; block commit if ESLint errors.
- Format `.json`/`.md` with Prettier.

### TypeScript

- **Strict mode** enabled; `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **Prefer `undefined`** for “not set” / optional; use `null` only when you must distinguish “explicitly empty” from “not set”. Optional props use `?:`; use `value ?? default` and optional chaining.

### Naming

| Kind             | Convention               | Example                |
| ---------------- | ------------------------ | ---------------------- |
| Components       | PascalCase               | `ItemCard.tsx`         |
| Hooks            | camelCase + use          | `useInventory.ts`      |
| Utils            | camelCase                | `calculateStatus.ts`   |
| Types/Interfaces | PascalCase               | `InventoryItem`        |
| Constants        | UPPER_SNAKE              | `DEFAULT_PAGE_SIZE`    |
| Test files       | `.test.ts` / `.test.tsx` | `status.test.ts`       |
| Stories          | `.stories.tsx`           | `ItemCard.stories.tsx` |

### Commit messages

Conventional `type: description`; optional body (bullets, `Refs: #issue`). **No scopes** (`feat:` not `feat(scope):`).

**Types:** `feat` (new features), `fix` (bug fixes), `refactor` (refactor without intended behavior change), `test` (tests), `docs` (documentation), `style` (formatting/style only), `chore` (deps, tooling, misc), `ci` (CI/CD), `build` (build/bundler), `perf` (performance).

**Never commit with `--no-verify`** — fix pre-commit failures instead. See `AGENTS.md` / `CLAUDE.md`.

### Scripts (target)

- `npm run lint` / `npm run lint:fix` — ESLint.
- `npm run format` / `npm run format:check` — Prettier.
- `npm run validate:i18n` — Check for missing/unused translation keys. Run in CI lint job.
- `npm run test` / `npm run test:unit` / `npm run test:watch` / `npm run test:coverage` — Jest unit + integration tests (RLS suite is `npm run test:rls` only).
- `npm run test:e2e` — Maestro E2E tests.
- `npm run test:a11y` — Accessibility tests.
- `npm run test:mutation` — StrykerJS mutation testing (local only).
- `npm run storybook` — Start Storybook component explorer.
- `npm run validate` — format:check + lint + validate:i18n + type-check + test + build.
- `npm run validate:all` — validate + E2E + a11y tests.

---

_Last updated: 2026-03-17_
