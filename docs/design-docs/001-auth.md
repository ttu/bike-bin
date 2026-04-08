# Auth

## Overview

Authentication for Bike Bin uses Supabase Auth with Google and Apple OAuth providers. The app supports three access modes: authenticated (full features), unauthenticated browsing (read-only public listings), and demo mode (simulated authenticated experience with mock data). Local inventory storage allows unauthenticated users to track items on-device.

## Data Model

Auth relies on Supabase's built-in `auth.users` table. The app-level `profiles` table extends it:

| Column        | Type                       | Description                     |
| ------------- | -------------------------- | ------------------------------- |
| id            | uuid (PK, FK → auth.users) | User ID                         |
| display_name  | text                       | User's display name             |
| avatar_url    | text                       | Profile photo URL               |
| bio           | text                       | User biography                  |
| rating_avg    | numeric                    | Aggregate rating average        |
| rating_count  | integer                    | Total ratings received          |
| push_token    | text                       | Push notification token         |
| distance_unit | text                       | Preferred distance unit (km/mi) |
| created_at    | timestamptz                | Profile creation timestamp      |

A database trigger automatically creates a profile row when a new user signs up via Supabase Auth.

## Architecture

```
src/features/auth/
├── components/
│   ├── AuthGate/
│   │   └── AuthGate.tsx        # Conditionally renders children based on auth state
│   └── SyncBanner/
│       └── SyncBanner.tsx      # Warning banner for unauthenticated users
├── hooks/
│   ├── useAuth.ts              # Primary auth hook, demo-mode aware
│   └── useLocalInventory.ts    # AsyncStorage-based local item storage
├── utils/
│   └── localStorage.ts         # AsyncStorage get/save/clear for local items
├── context.ts                   # AuthContextType definition + React context
├── provider.tsx                 # AuthProvider — session listener, OAuth methods
└── index.ts                     # Public API exports
```

**Key exports:** `AuthProvider`, `useAuth`, `useLocalInventory`, `AuthGate`, `useAuthGate`, `SyncBanner`

### AuthProvider

Wraps the app. Listens to `supabase.auth.onAuthStateChange` and exposes session, user, loading state, and sign-in/sign-out methods via React context.

### useAuth

Consumes `AuthContext`. When demo mode is active (via `DemoModeContext`), returns a mock authenticated state with a `DEMO_USER` object instead of the real session.

### AuthGate / useAuthGate

- `AuthGate`: Render-prop component — shows children when authenticated, optional fallback otherwise.
- `useAuthGate`: Hook returning `requireAuth(action)` — executes the action if authenticated, otherwise shows a sign-in modal with a redirect to the login screen.

### useLocalInventory / localStorage

For unauthenticated users. Stores items in AsyncStorage under `@bike-bin/local-inventory`. Provides CRUD operations (`addItem`, `removeItem`, `updateItem`, `clearAll`).

### SyncBanner

A `react-native-paper` Banner shown to unauthenticated users on the inventory screen. Prompts them to sign in to sync and share items.

## Screens & Navigation

| Route                | Screen       | Purpose                                                                                         |
| -------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `(auth)/_layout.tsx` | Auth layout  | Layout wrapper for auth screens                                                                 |
| `(auth)/login.tsx`   | Login screen | OAuth buttons (Google, Apple), browse without signing in, demo mode, test-user password login (`isPasswordDemoLoginEnabled`) |

**Test-user password login** (`isPasswordDemoLoginEnabled` in `src/shared/utils/env.ts`): Shown when `EXPO_PUBLIC_ENV` is `development`, `test`, `preview`, or `staging` — including PR web previews and staging deploys so seeded demo accounts work. Hidden when `EXPO_PUBLIC_ENV` is `production`.

## Key Flows

### Sign In (OAuth)

1. User taps "Continue with Google" or "Continue with Apple"
2. `signInWithGoogle()` / `signInWithApple()` calls `supabase.auth.signInWithOAuth()`
3. Supabase handles OAuth redirect
4. `onAuthStateChange` fires with new session
5. AuthProvider updates state → app re-renders as authenticated
6. Database trigger creates `profiles` row on first sign-up

### Browse Without Signing In

1. User taps "Browse without signing in"
2. Router navigates to `/(tabs)/inventory`
3. `isAuthenticated` is false → SyncBanner shown, local inventory used
4. Features requiring auth (messaging, borrow, etc.) trigger AuthGate modal

### Demo Mode

1. User taps "Try Demo"
2. `enterDemoMode()` from `DemoModeContext` activates demo state
3. `useAuth` returns `DEMO_USER` as authenticated
4. Demo data is shown instead of real database data

## RLS & Security

Profiles table RLS policies:

| Policy                   | Operation | Rule                                                        |
| ------------------------ | --------- | ----------------------------------------------------------- |
| `profiles_select_public` | SELECT    | All authenticated users can read all profiles               |
| `profiles_select_own`    | SELECT    | Users can read their own profile                            |
| `profiles_insert_own`    | INSERT    | Users can only insert their own profile (`auth.uid() = id`) |
| `profiles_update_own`    | UPDATE    | Users can only update their own profile                     |
| `profiles_delete_own`    | DELETE    | Users can only delete their own profile                     |

Auth tokens are managed entirely by the Supabase client SDK. No tokens are stored manually.

## i18n

Namespace: `auth`

| Key                           | Purpose                           |
| ----------------------------- | --------------------------------- |
| `welcome.title`               | App title on login screen         |
| `welcome.tagline`             | Tagline ("From bikers to bikers") |
| `welcome.continueWithApple`   | Apple OAuth button label          |
| `welcome.continueWithGoogle`  | Google OAuth button label         |
| `welcome.browseWithout`       | Browse without signing in         |
| `gate.title`                  | Auth gate modal title             |
| `gate.description`            | Auth gate modal description       |
| `gate.signIn` / `gate.cancel` | Modal action buttons              |
| `syncBanner.message`          | Sync warning banner text          |
| `syncBanner.signIn`           | Banner action button              |
| `guestProfile.title`          | Guest profile CTA title           |
| `guestProfile.benefits`       | Guest profile benefits text       |
| `guestProfile.signIn`         | Guest profile sign-in button      |
| `devLogin.*`                  | Dev login UI (non-production)     |

## Current Status

- **Implemented:** Google OAuth, Apple OAuth, session management, AuthProvider, AuthGate, useAuthGate, SyncBanner, local inventory storage, demo mode integration, dev login for testing
- **Working:** Full auth flow including unauthenticated browsing with local storage fallback
- **Not implemented:** Email/password auth (by design — OAuth only), email verification, password reset
