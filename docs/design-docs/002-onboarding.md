# Onboarding

## Overview

A two-step onboarding flow for newly authenticated users. Collects a display name (with optional photo) and a primary location via postcode geocoding. Both steps are skippable. Onboarding completeness is tracked via `useOnboardingStatus` which checks whether the user has a profile display name and at least one saved location.

## Data Model

Onboarding writes to existing tables — no dedicated onboarding tables:

- **`profiles`** — sets `display_name` (and eventually `avatar_url`)
- **`saved_locations`** — creates the user's first location with `is_primary = true`

See [001-auth.md](001-auth.md) for profiles schema and [010-locations.md](010-locations.md) for saved_locations schema.

## Architecture

```
src/features/onboarding/
├── components/
│   └── ProgressDots.tsx         # Step indicator dots (current/total)
├── hooks/
│   └── useOnboardingStatus.ts   # Checks profile + location completeness
└── index.ts                     # Public API: useOnboardingStatus, ProgressDots
```

### useOnboardingStatus

Queries both `profiles` (for `display_name`) and `saved_locations` (for any row) via TanStack Query. Returns:

```typescript
interface OnboardingStatus {
  isComplete: boolean; // hasProfile && hasLocation
  hasProfile: boolean; // display_name is set
  hasLocation: boolean; // at least one saved location exists
  isLoading: boolean;
}
```

Only runs when authenticated (`enabled: isAuthenticated && !!user`).

### ProgressDots

Simple visual step indicator — renders `total` dots with `current` highlighted in primary color. Used by both onboarding screens.

## Screens & Navigation

| Route                       | Screen         | Step | Purpose                          |
| --------------------------- | -------------- | ---- | -------------------------------- |
| `(onboarding)/_layout.tsx`  | Layout         | —    | Stack layout wrapper             |
| `(onboarding)/profile.tsx`  | Profile Setup  | 1/2  | Display name + photo placeholder |
| `(onboarding)/location.tsx` | Location Setup | 2/2  | Postcode entry, geocoding, label |

### Profile Setup (Step 1)

- Pre-fills display name from OAuth user metadata (`user.user_metadata.full_name`)
- Photo upload placeholder (camera icon, not yet functional)
- Continue persists the display name to the `profiles` table via `useUpdateProfile`; Skip leaves it unset
- Navigates to the location step on success

### Location Setup (Step 2)

- Postcode input with auto-geocoding on blur
- Shows area preview on successful geocode (map marker + area name)
- Optional label field (defaults to "Home")
- Privacy callout: "Only the area name is visible to others"
- Saves location via `useCreateLocation` mutation (from locations feature)
- Skip or Done → navigates to `/(tabs)/inventory`

## Key Flows

### First-Time User Onboarding

1. User completes OAuth sign-in
2. App checks `useOnboardingStatus` → `isComplete: false`
3. Router directs to `/(onboarding)/profile`
4. User enters display name (or skips) → proceeds to location
5. User enters postcode → geocoded to coordinates → saves as primary location
6. Router replaces to `/(tabs)/inventory`

### Skipping Onboarding

Both steps allow skipping. If the user skips:

- Profile: No display name saved (can be set later in profile settings)
- Location: No location saved (distance-based search won't work until one is added)

## i18n

Namespace: `onboarding`

| Key                                                 | Purpose                   |
| --------------------------------------------------- | ------------------------- |
| `profile.title`                                     | "Set up your profile"     |
| `profile.photoLabel`                                | "Add a photo"             |
| `profile.displayNameLabel`                          | Display name field label  |
| `profile.displayNamePlaceholder`                    | "How others will see you" |
| `profile.skip` / `profile.continue`                 | Navigation buttons        |
| `location.title`                                    | "Add your location"       |
| `location.postcodeLabel`                            | "Postcode / ZIP"          |
| `location.postcodePlaceholder`                      | Input placeholder         |
| `location.labelLabel` / `location.labelPlaceholder` | Location label field      |
| `location.privacyCallout`                           | Privacy explanation text  |
| `location.skip` / `location.done`                   | Navigation buttons        |
| `steps`                                             | Step counter template     |

Also uses `locations` namespace for geocoding messages (`errors.geocodeFailed`, `form.geocoding`, `onboarding.areaPreview`).

## Current Status

- **Implemented:** Two-step flow (profile + location), progress dots, postcode geocoding, display-name save to Supabase, location save, skip support, i18n
- **Not implemented:** Photo upload during onboarding, re-triggering onboarding for incomplete profiles
