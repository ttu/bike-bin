# Profile

## Overview

User profile management including editing display name, viewing public profiles, managing settings (distance unit, appearance), help & support requests, content reporting, and account deletion (GDPR-compliant). The profile tab also serves as the hub for navigating to locations, borrow requests, groups, and notification settings.

## Data Model

### profiles table

See [001-auth.md](001-auth.md) for full schema. Key fields: `display_name`, `avatar_url`, `bio`, `rating_avg`, `rating_count`, `push_token`, `distance_unit`.

### support_requests table

| Column          | Type                 | Description                    |
| --------------- | -------------------- | ------------------------------ |
| id              | uuid (PK)            | Request ID                     |
| user_id         | uuid (FK → profiles) | Submitter                      |
| subject         | text                 | Subject line                   |
| body            | text                 | Message body                   |
| email           | text                 | Contact email                  |
| screenshot_path | text                 | Optional screenshot in Storage |
| app_version     | text                 | Auto-included app version      |
| device_info     | text                 | Auto-included device info      |
| status          | support_status enum  | open, closed                   |
| created_at      | timestamptz          | Submission timestamp           |

### reports table

| Column      | Type                    | Description              |
| ----------- | ----------------------- | ------------------------ |
| id          | uuid (PK)               | Report ID                |
| reporter_id | uuid (FK → profiles)    | Reporter                 |
| target_type | report_target_type enum | item, user               |
| target_id   | uuid                    | Reported item or user ID |
| reason      | text                    | Report reason            |
| details     | text                    | Additional details       |
| status      | report_status enum      | open, reviewed, closed   |
| created_at  | timestamptz             | Report timestamp         |

### Key types

- **PublicProfile** — public view of a user (name, avatar, rating, member since)
- **PublicListing** — item visible on a user's public profile

## Architecture

```
src/features/profile/
├── components/
│   └── ProfileHeader/
│       └── ProfileHeader.tsx       # Profile card with avatar, name, rating
├── hooks/
│   ├── useProfile.ts               # Own profile query
│   ├── usePublicProfile.ts         # Other user's public profile
│   ├── usePublicListings.ts        # Public listings for a user
│   ├── useUpdateProfile.ts         # Update display name mutation
│   ├── useDistanceUnit.ts          # Distance unit preference
│   ├── useSubmitSupport.ts         # Submit support request
│   └── useDeleteAccount.ts         # Account deletion (GDPR)
├── types.ts                         # PublicProfile, PublicListing
└── index.ts                         # Public API
```

## Screens & Navigation

| Route                                      | Screen                | Purpose                                      |
| ------------------------------------------ | --------------------- | -------------------------------------------- |
| `(tabs)/profile/index.tsx`                 | Profile Home          | Profile header + settings menu               |
| `(tabs)/profile/edit-profile.tsx`          | Edit Profile          | Display name editing                         |
| `(tabs)/profile/[userId].tsx`              | Public Profile        | Other user's profile with ratings + listings |
| `(tabs)/profile/locations.tsx`             | Saved Locations       | Managed by locations feature                 |
| `(tabs)/profile/borrow-requests.tsx`       | Borrow Requests       | Managed by borrow feature                    |
| `(tabs)/profile/notification-settings.tsx` | Notification Settings | Managed by notifications feature             |
| `(tabs)/profile/export-data.tsx`           | Data Export (GDPR)    | Managed by data-export feature               |
| `(tabs)/profile/support.tsx`               | Help & Support        | Support request form                         |
| `(tabs)/profile/about.tsx`                 | About & Legal         | App version, terms, privacy, licenses        |

> Groups moved to a dedicated top-level tab (`(tabs)/groups/...`) — see [009-groups.md](009-groups.md) and [020-design-handoff-alignment.md](020-design-handoff-alignment.md) for the rationale.

## Key Flows

### Editing Profile

1. User taps "Edit Profile" → navigates to edit screen
2. Updates display name → `useUpdateProfile` saves to profiles table
3. Success feedback → returns to profile

### Viewing Public Profile

1. User taps owner name on listing or conversation
2. `usePublicProfile` fetches name, avatar, rating, member since
3. `usePublicListings` fetches their public items
4. Shows reviews via ratings feature

### Account Deletion (GDPR)

1. User navigates to delete account → warning about consequences
2. Must type "DELETE" to confirm
3. `useDeleteAccount` triggers deletion:
   - Items deleted
   - Conversations preserved with "[Deleted user]" marker
   - Ratings anonymized
   - Profile data removed

### Reporting Content

1. User taps "Report" on item or profile
2. Selects reason (inappropriate, spam, stolen goods, misleading condition, harassment, other)
3. Optional details → submits to reports table

## i18n

Namespace: `profile`

Key areas: `header.*` (profile card), `menu.*` (settings menu items), `editScreen.*` (edit form), `support.*` (support form), `report.*` (report form with reason options), `about.*` (legal links), `deleteAccount.*` (deletion flow), `publicProfile.*` (public view), `distanceUnit.*`, `appearance.*`, `signOutConfirm.*`.

## Current Status

- **Implemented:** Profile viewing/editing, public profiles, support requests, content reporting, account deletion, distance unit preference, appearance settings, about/legal screen
- **Working:** All settings, GDPR deletion flow, report submission
