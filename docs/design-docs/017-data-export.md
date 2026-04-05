# Data Export

## Overview

GDPR-compliant data export allowing users to download all their personal data as a ZIP archive containing JSON files and photos. Triggered from the profile screen, processed asynchronously via two edge functions (`request-export` and `generate-export`), delivered through Supabase Storage with in-app notification on completion.

## Architecture

```
src/features/profile/
├── hooks/
│   ├── useRequestExport.ts       # Mutation: invoke request-export edge function
│   └── useLatestExport.ts        # Query: poll export_requests for latest status
app/(tabs)/profile/
└── export-data.tsx               # Export Data screen (6 states)
supabase/functions/
├── request-export/index.ts       # User-facing: auth, rate limit, create record
└── generate-export/index.ts      # Internal worker: collect data, build ZIP, upload
supabase/migrations/
└── 00011_export_requests_storage.sql  # Table, RLS, storage bucket
```

### Two-Phase Edge Function Design

1. **`request-export`** (user-facing) — authenticates, enforces rate limits, inserts a `pending` record, fires-and-forgets to `generate-export`. Returns 202 immediately.
2. **`generate-export`** (internal) — accepts service role auth only. Queries all user data in parallel, downloads photos in batches, assembles ZIP, uploads to storage, updates status, sends notification.

The fire-and-forget pattern uses `fetch()` (not `supabase.functions.invoke()`) to avoid edge runtime quirks.

## Data Model

### export_requests table

| Column        | Type                                    | Description                            |
| ------------- | --------------------------------------- | -------------------------------------- |
| id            | uuid (PK)                               | ExportRequestId branded type           |
| user_id       | uuid (FK → profiles, ON DELETE CASCADE) | Requesting user                        |
| status        | export_request_status enum              | pending, processing, completed, failed |
| storage_path  | text                                    | Path in data-exports bucket            |
| error_message | text                                    | Populated on failure                   |
| expires_at    | timestamptz                             | now() + 48h on completion              |
| created_at    | timestamptz                             | Request time, used for rate limiting   |
| updated_at    | timestamptz                             | Tracks status transitions              |

### data-exports storage bucket

- Private (no public access)
- Path format: `exports/{userId}/{exportRequestId}.zip`
- Access: signed URLs only (1-hour TTL)
- RLS: path-based — splits storage path on `/` and checks segment matches `auth.uid()`

### RLS Policies

| Policy                       | Operation | Rule                                      |
| ---------------------------- | --------- | ----------------------------------------- |
| `export_requests_select_own` | SELECT    | `auth.uid() = user_id`                    |
| `export_requests_insert_own` | INSERT    | `auth.uid() = user_id`                    |
| No UPDATE/DELETE             | —         | Only service role can modify              |
| `data_exports_select_own`    | SELECT    | Storage path segment matches `auth.uid()` |
| No INSERT/DELETE             | —         | Only service role can upload/manage       |

## Domain Types

```typescript
// Branded ID
export type ExportRequestId = Brand<string, 'ExportRequestId'>;

// Status enum
export const ExportRequestStatus = {
  Pending: 'pending',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const;

// Domain model
export interface ExportRequest {
  id: ExportRequestId;
  userId: UserId;
  status: ExportRequestStatus;
  storagePath: string | undefined;
  errorMessage: string | undefined;
  expiresAt: string | undefined;
  createdAt: string;
  updatedAt: string;
}
```

## Key Flows

### Requesting an Export

1. User taps "Export My Data" on profile export screen
2. `useRequestExport` mutation gets session access token (no refresh to avoid 400 errors)
3. Calls `request-export` edge function with Bearer token + anon key headers
4. Edge function validates auth, checks rate limits, inserts `pending` record
5. Fire-and-forget invokes `generate-export` via `fetch()`
6. Returns 202 with export request ID
7. Mutation invalidates `['latest-export']` query key

### Generating the Export

1. `generate-export` verifies service role auth, loads `pending` record
2. Sets status to `processing`
3. **Phase 1 — parallel queries:** profiles, saved_locations, items, bikes, conversation_participants, borrow_requests (as requester), ratings (given + received), group_members with groups, notifications, support_requests, reports, subscriptions
4. **Phase 2 — dependent queries:** item_photos, bike_photos (batched), item_groups, conversations, messages, borrow_requests (as owner)
5. Downloads photos in batches of 20 from: `avatars`, `item-photos` (items/ and bikes/ prefixes), `support-screenshots`. Graceful failure per-photo.
6. Assembles ZIP with `fflate.zipSync()`:
   ```
   export/
     profile.json
     locations.json
     items.json
     bikes.json
     conversations.json
     borrow_requests.json
     ratings.json          (with direction: given/received)
     groups.json            (memberships + item_groups)
     notifications.json
     support_requests.json
     reports.json
     subscriptions.json
     photos/
       avatar.{ext}
       items/{itemId}/{filename}
       bikes/{bikeId}/{filename}
       support/{requestId}/{filename}
   ```
7. Uploads ZIP to `data-exports` bucket
8. Updates record: `status: completed`, `storage_path`, `expires_at: now() + 48h`
9. Inserts notification with type `data_export_ready`
10. On any error: sets `status: failed` with `error_message`

### Downloading the Export

1. `useLatestExport` polls every 5s while status is pending/processing
2. On completion, screen shows "Download" button with expiry countdown (hours remaining)
3. Tap "Download" generates a signed URL (1-hour TTL) from storage
4. **Native:** `expo-file-system` downloads to cache + Share sheet via `expo-sharing`
5. **Web:** `Linking.openURL()` triggers browser download

## Screen States

The export screen (`app/(tabs)/profile/export-data.tsx`) derives one of 6 states from the latest export record:

| State       | Trigger                        | UI                                       |
| ----------- | ------------------------------ | ---------------------------------------- |
| ready       | No export or expired           | Description + "Export My Data" button    |
| requesting  | Mutation pending               | Button disabled with spinner             |
| processing  | Status pending/processing      | "Your export is being prepared" message  |
| download    | Status completed + not expired | "Download" button with hours remaining   |
| failed      | Status failed                  | Error message + "Try Again" button       |
| rateLimited | Completed export within 24h    | Shows when next export becomes available |

## Rate Limiting

| Condition                        | Result                 |
| -------------------------------- | ---------------------- |
| Completed export in last 24h     | 429 with Retry-After   |
| Failed export in last 1h         | 429 with Retry-After   |
| Pending/processing export active | 429 (wait for current) |

## i18n

Namespace: `profile` (keys under `export.*`)

Keys: `menuLabel`, `title`, `description`, `included`, `includedItems`, `button`, `requesting`, `processing`, `readyTitle`, `readyMessage`, `expiresIn` (with `{{hours}}` interpolation), `download`, `failed`, `retry`, `rateLimited` (with `{{time}}` interpolation), `expired`.

## Testing

### Unit Tests

- `useRequestExport.test.ts` — edge function invocation with correct headers, auth failure handling
- `useLatestExport.test.ts` — query chain mock, status polling, null handling

### Integration Tests

- `useExportIntegration.test.ts` — mutation success invalidates query key, rate limit error handling

### RLS Tests

- `export_storage.rls.test.ts` — SELECT own only, INSERT own only, UPDATE/DELETE blocked, storage path-based access control
- `generate-export.edge.rls.test.ts` — full integration: creates test user with items/bikes/photos, invokes edge function, validates ZIP contents contain real photo bytes, verifies storage path and status

## Design Decisions

| Decision               | Choice                           | Rationale                                                |
| ---------------------- | -------------------------------- | -------------------------------------------------------- |
| Two-phase architecture | request-export + generate-export | Instant user response, retryable worker, decoupled       |
| fire-and-forget fetch  | `fetch()` not `functions.invoke` | Avoids Supabase edge runtime quirks                      |
| No token refresh       | Use access token directly        | Avoids 400 errors on bad refresh tokens (web/local)      |
| Photo batch size       | 20 concurrent downloads          | Balances throughput vs memory                            |
| Graceful photo failure | Warn + continue                  | Missing photo shouldn't block entire export              |
| 48h expiry             | ZIP deleted after 48h            | Avoids indefinite storage accumulation                   |
| Client-side expiry     | No cron cleanup                  | Low volume; add cron later if needed                     |
| ZIP format             | JSON + photos via fflate         | Complete GDPR portability, lightweight Deno-compatible   |
| Signed URL TTL         | 1 hour                           | Short enough for security, long enough for slow networks |

## Current Status

Fully implemented. Covers GDPR right-to-access and right-to-portability. Compatible with delete-account anonymization flow (export captures data before anonymization).
