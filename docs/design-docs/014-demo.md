# Demo

## Overview

Demo mode lets users experience the app without signing in. It provides a simulated authenticated experience with mock data seeded into TanStack Query caches. No database calls are made in demo mode — all data comes from local fixtures.

## Architecture

```
src/features/demo/
├── components/
│   └── DemoBanner.tsx              # Banner indicating demo mode is active
├── hooks/
│   ├── useDemoMode.ts              # Context hook: isDemoMode, enter, exit
│   └── useDemoQuerySeeder.ts       # Seeds TanStack Query cache with fixtures
├── data/
│   ├── fixtures.ts                  # Mock items, bikes, conversations, etc.
│   ├── ids.ts                       # Branded IDs for demo entities
│   └── index.ts                     # Data exports
├── context.ts                       # DemoModeContextType definition
├── provider.tsx                     # DemoModeProvider (state management)
└── index.ts                         # Public API: DemoModeProvider, useDemoMode, DemoBanner
```

### Integration with Auth

When demo mode is active, `useAuth` returns a mock `DEMO_USER` object with `isAuthenticated: true`. This allows all authenticated UI to render without a real session.

### Query seeding

`useDemoQuerySeeder` pre-populates TanStack Query caches with fixture data so screens display content immediately. This includes mock items, bikes, conversations, and other entities.

### DemoBanner

Persistent banner shown at the top of screens during demo mode with a "Sign up for free" CTA.

## Key Flows

### Entering Demo Mode

1. User taps "Try the demo" on login screen
2. `enterDemoMode()` activates demo state in context
3. `useDemoQuerySeeder` seeds query caches with fixtures
4. Router navigates to inventory tab
5. App renders as authenticated with mock data

### Exiting Demo Mode

1. User taps "Exit Demo Mode" in profile menu
2. `exitDemoMode()` clears demo state
3. Query caches cleared
4. Returns to login screen

## i18n

Namespace: `demo`

Keys: `banner.message` (demo mode indicator), `banner.signUp` (CTA), `welcome.tryDemo` (login screen button), `profile.exitDemo` (exit button).

## Current Status

- **Implemented:** Demo mode toggle, fixture data, query seeding, DemoBanner, auth integration
- **Working:** Full demo experience without network calls
