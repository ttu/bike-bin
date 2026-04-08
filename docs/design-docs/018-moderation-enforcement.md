# Moderation Enforcement

## Overview

Content moderation system enabling users to report unsuitable **items**, **item photos**, **chat messages**, and **user profiles**, with admin enforcement via a secured Edge Function that performs a hard purge of the offending user's data and blocks their OAuth identities from re-registering. User-profile reports use `targetType: 'user'` and are filed via the profile flag icon; enforcement closes all report types targeting the sanctioned user's content. Distinct from GDPR self-service account deletion: enforcement prioritizes removal of harmful content and account closure over conversation continuity.

## Architecture

```text
src/shared/
├── components/
│   └── ReportDialog/
│       ├── ReportDialog.tsx          # Modal with reason radio group + optional details
│       └── __tests__/ReportDialog.test.tsx
├── hooks/
│   ├── useReport.ts                  # Mutation: insert into reports table
│   └── __tests__/useReport.test.ts
app/(tabs)/
├── messages/[id].tsx                 # Message long-press → report dialog
├── profile/[userId].tsx              # Flag icon → report user dialog
├── search/                           # Photo long-press → report photo dialog
src/features/search/components/
└── ListingDetailRoute/
    └── ListingDetailRoute.tsx        # Photo long-press handler, report dialog
src/shared/components/
└── PhotoGallery/PhotoGallery.tsx     # onLongPress callback for photo items
supabase/functions/
└── admin-enforce-sanction/index.ts   # Secret-protected admin purge + block
supabase/migrations/
└── 00015_moderation.sql              # Schema: blocklist, enforcement log, auth hook
```

## Data Model

### Extended enum: `report_target_type`

Added values: `item_photo`, `message` (existing: `item`, `user`).

### Table: `blocked_oauth_identities`

| Column           | Type          | Description                         |
| ---------------- | ------------- | ----------------------------------- |
| id               | uuid (PK)     | `gen_random_uuid()`                 |
| provider         | text NOT NULL | e.g. `google`, `apple`              |
| provider_user_id | text NOT NULL | Provider's stable subject           |
| notes            | text          | Internal: report id, reason, ticket |
| created_at       | timestamptz   | Default `now()`                     |

Constraint: `UNIQUE (provider, provider_user_id)` — idempotent upserts.

### Table: `moderation_enforcement_log`

| Column             | Type          | Description           |
| ------------------ | ------------- | --------------------- |
| id                 | uuid (PK)     | `gen_random_uuid()`   |
| sanctioned_user_id | uuid NOT NULL | The purged user       |
| performed_by       | text NOT NULL | `edge_function`       |
| reason             | text          | Policy violation type |
| report_ids         | uuid[]        | Related report IDs    |
| created_at         | timestamptz   | Default `now()`       |

### Auth Hook Function: `check_blocked_identity`

Postgres function (`SECURITY DEFINER`) registered as a **Before Sign-In** hook. Queries `blocked_oauth_identities` for any matching `(provider, provider_user_id)` from the incoming event's identities array. Returns `{"decision": "reject", "message": "Sign-in not allowed"}` on match — generic error, no internal state leakage.

Why Before Sign-In over Before User Created: fires on every authentication attempt, not just first sign-up, catching re-auth after partial cleanup.

### Helper Function: `find_empty_conversations`

`SECURITY DEFINER` function returning conversations with zero participants and zero messages. Used by the edge function to clean up orphan conversations after purge.

### RLS Policies

| Table                        | Operation      | Rule                                          |
| ---------------------------- | -------------- | --------------------------------------------- |
| `blocked_oauth_identities`   | ALL            | No authenticated policies — service-role only |
| `moderation_enforcement_log` | ALL            | No authenticated policies — service-role only |
| `reports` (existing)         | SELECT, INSERT | Own reports only (unchanged)                  |

## Domain Types

```typescript
// Report reasons (client-side)
type ReportReason =
  | 'inappropriate'
  | 'spam'
  | 'stolenGoods'
  | 'misleadingCondition'
  | 'harassment'
  | 'other';

// Report target types (maps to DB enum)
type ReportTargetType = 'item' | 'user' | 'item_photo' | 'message';

// Report mutation input
interface SubmitReportInput {
  reporterId: UserId;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  text?: string;
}
```

## Key Flows

### Reporting Content (Client)

1. User long-presses a **photo** (ListingDetailRoute) or **message** ([id].tsx), or taps **flag icon** on a public profile
2. `ReportDialog` opens with 6 reason options + optional details text input
3. On submit, `useReport` mutation inserts into `reports` with `target_type`, `target_id`, `reason` (camelCase → snake_case), optional `text`, `status: 'open'`
4. Success/error snackbar displayed via `useSnackbarAlerts`
5. Only other users' content is reportable (own content long-press is disabled)

### Admin Enforcement (Edge Function)

Invoked via curl/Dashboard with `x-admin-secret` header — **not callable from the app**.

1. **Validate** secret via constant-time comparison (`timingSafeEqual`) and parse `userId`
2. **Load identities** via Auth Admin API (`getUserById`)
3. **Upsert** `blocked_oauth_identities` for each `(provider, provider_user_id)` — before deleting auth user
4. **Collect storage paths** — avatar, item photos, bike photos, data exports
5. **Delete storage objects** from respective buckets (handle 404s gracefully for retries)
6. **Data purge** (explicit deletes for logging/counting):
   - Item photos → items (cascades borrow_requests)
   - Bike photos → bikes
   - Messages where `sender_id = userId` (hard delete, not anonymize)
   - Conversation participants → empty conversations
   - Ratings where `from_user_id` or `to_user_id` = userId
   - Borrow requests, export requests, subscriptions
   - Support requests, saved locations, group members, notifications
   - Close reports targeting user's content (`status = 'closed'`)
   - Delete reports filed by user
   - Delete profile
7. **Log** enforcement action to `moderation_enforcement_log`
8. **Delete auth user** (`auth.admin.deleteUser`) — last step
9. Return 200 with summary counts or 400/401/404/500 with safe error messages

### Idempotency

- Blocklist upsert: `ON CONFLICT DO NOTHING`
- Row deletes: no-op on already-purged data
- Storage deletions: 404s handled gracefully

## Distinction vs GDPR `delete-account`

| Aspect    | GDPR self-delete                                    | Admin enforcement                                  |
| --------- | --------------------------------------------------- | -------------------------------------------------- |
| Goal      | User-initiated privacy right                        | Abuse / policy violation                           |
| Messages  | Other party sees thread with "deleted user" styling | Sanctioned user's messages **removed** entirely    |
| Ratings   | Anonymize authors (scores may remain)               | **Delete** rows involving sanctioned user          |
| Auth user | Deleted                                             | Deleted **after** identities recorded on blocklist |
| Comeback  | Same person may sign up again                       | **Blocked** OAuth identities                       |

## i18n

Namespace: `profile` (keys under `report.*`)

Keys: `title`, `reasonLabel`, `reasons.inappropriate`, `reasons.spam`, `reasons.stolenGoods`, `reasons.misleadingCondition`, `reasons.harassment`, `reasons.other`, `detailsLabel`, `detailsPlaceholder`, `submit`, `submitting`, `successMessage`, `errorMessage`, `validationReason`.

Additional: `search.listing.report` for listing detail context.

## Testing

### Unit Tests

- `ReportDialog.test.tsx` — rendering, reason selection, validation, submit with/without details, loading state, dismissal
- `useReport.test.ts` — insertion with all target types, camelCase → snake_case field mapping, error handling

### Integration Tests (Screen-level)

- `ConversationDetailScreen.test.tsx` — message long-press opens report dialog, submit calls mutation
- `ListingDetailScreen.test.tsx` — photo long-press opens report dialog, submit calls mutation
- `ListingDetail.test.tsx` — photo long-press callback wiring

### RLS Tests

- `moderation.rls.test.ts` — `blocked_oauth_identities` and `moderation_enforcement_log` blocked for authenticated, accessible for service-role; reports with new target types (`item_photo`, `message`)

## Design Decisions

| Decision                   | Choice                                                   | Rationale                                                                |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| Admin UX                   | Dashboard + curl (no in-app moderator UI)                | Sufficient for MVP; low volume                                           |
| Secret comparison          | `timingSafeEqual` constant-time comparison               | Prevents timing-based secret extraction                                  |
| Auth hook type             | Before Sign-In Postgres function (not Edge Function)     | Single SELECT query, no network hop, fires on every auth attempt         |
| Message handling           | Hard DELETE (not anonymize)                              | Removes harmful content; differs from GDPR path by design                |
| Explicit deletes           | Per-table deletes with counts (CASCADE as safety net)    | Enables storage path collection, per-table logging, conversation cleanup |
| Report dialog reasons      | 6 fixed options + optional free text                     | Covers common abuse categories; text for nuance                          |
| Reports on enforcement     | Close reports targeting user; delete reports by user     | Preserves audit trail for moderation history                             |
| Empty conversation cleanup | Delete conversations with zero participants and messages | Prevents orphan accumulation after purge                                 |

## Open Points

- **Apple relay emails:** Blocklist uses provider + subject (not email) for reliability
- **Legal retention:** Minimal audit rows for disputes (jurisdiction-dependent)
- **Group admin succession:** Groups losing sole admin acceptable for MVP (manual Dashboard fix)
- **Subscription provider sync:** If external payment providers added later, cancel before row deletion

## Current Status

Fully implemented. Client-side reporting for photos, messages, and user profiles. Server-side enforcement via admin edge function with OAuth blocklist and auth hook.
