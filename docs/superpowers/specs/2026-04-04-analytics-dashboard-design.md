# Analytics Dashboard — Design Spec

## Overview

Internal analytics system for tracking user actions, errors, and aggregate counts. Data is captured via Postgres triggers (server-side) and direct inserts from the app (client-side), stored in a single `analytics_events` table, and queried through SQL views in Supabase Studio.

**Audience:** Developer/founder and small team, via Supabase Studio.

**Privacy:** All events use a hashed anonymous ID (`SHA256(user_id + secret)`). No real `user_id` is stored in analytics. Since data is anonymous, no GDPR delete/export obligation applies to analytics events.

**Security note on hashing secret:** The client-side secret uses the `EXPO_PUBLIC_` prefix, making it visible in the JavaScript bundle. Since `user_id` values are UUIDs (not guessable), and the purpose is pseudonymization (not encryption), this is an acceptable trade-off. The hash prevents casual identification but is not cryptographically secure against a determined attacker who knows both the secret and a target user's ID. If stronger anonymization is needed in the future, hashing can be moved server-side via an RPC.

## Architecture

```
+-----------------+       +---------------------+       +------------------+
| Expo App        |       | Supabase Postgres   |       | Supabase Studio  |
|                 |       |                     |       |                  |
| trackEvent() -------->  | analytics_events    | <---- | SQL Views        |
| trackError()    |       |   (single table)    |       | (dashboard)      |
|                 |       |                     |       |                  |
+-----------------+       | Triggers on:        |       +------------------+
                          |  items, bikes,      |
                          |  messages, etc.     |       +------------------+
                          |  also insert here --+-----> | Sentry           |
                          +---------------------+       | (code bugs only) |
                                                        +------------------+
```

### Event flow

- **Server-side (triggers):** DB mutations on existing tables fire `AFTER INSERT/UPDATE` triggers that call a shared `log_analytics_event()` function. These are always `status: 'success'` (a failed write never reaches the trigger).
- **Client-side (direct insert):** The app inserts events for actions that don't touch the DB (app open, page visit, login, search). These can be `success` or `error`.
- **Edge functions:** `delete-account` and `request-export` compute the anonymous hash and insert directly.

## Database Schema

### `analytics_events` table

| Column          | Type                                | Notes                                  |
| --------------- | ----------------------------------- | -------------------------------------- |
| `id`            | `uuid` PK                           | `gen_random_uuid()`                    |
| `anonymous_id`  | `text` NOT NULL                     | `SHA256(user_id + secret)`             |
| `event_type`    | `text` NOT NULL                     | Dot-notation: `item.add`, `page.visit` |
| `status`        | `text` NOT NULL DEFAULT `'success'` | `success` or `error`                   |
| `error_message` | `text`                              | null for success events                |
| `metadata`      | `jsonb` DEFAULT `'{}'`              | Event-specific data                    |
| `created_at`    | `timestamptz` DEFAULT `now()`       | Server timestamp                       |

**RLS:** Enabled. Authenticated users can INSERT only (no SELECT/UPDATE/DELETE). Service role has full access.

**Indexes:**

- `btree(event_type, created_at)` — dashboard queries
- `btree(anonymous_id)` — per-user correlation queries

### Event types

#### Server-side (via triggers)

| Event type                | Trigger on                                       | Metadata                                                                                                    |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `user.created`            | `profiles` INSERT                                | `{}`                                                                                                        |
| `item.add`                | `items` INSERT                                   | `{ category }`                                                                                              |
| `item.edit`               | `items` UPDATE                                   | `{ category }`                                                                                              |
| `bike.add`                | `bikes` INSERT                                   | `{ type }`                                                                                                  |
| `bike.edit`               | `bikes` UPDATE                                   | `{ type }`                                                                                                  |
| `conversation.started`    | `conversation_participants` INSERT               | `{}` — `conversations` has no user ID column; trigger fires on first participant insert, uses `NEW.user_id` |
| `message.sent`            | `messages` INSERT                                | `{ conversation_id }` — uses `NEW.sender_id`                                                                |
| `report.created`          | `reports` INSERT                                 | `{ target_type }` — uses `NEW.reporter_id`                                                                  |
| `borrow_request.created`  | `borrow_requests` INSERT                         | `{ item_id }` — uses `NEW.requester_id`                                                                     |
| `borrow_request.accepted` | `borrow_requests` UPDATE (status → accepted)     | `{ item_id }` — uses `NEW.requester_id`                                                                     |
| `borrow_request.rejected` | `borrow_requests` UPDATE (status → rejected)     | `{ item_id }` — uses `NEW.requester_id`                                                                     |
| `borrow_request.returned` | `borrow_requests` UPDATE (status → returned)     | `{ item_id }` — uses `NEW.requester_id`                                                                     |
| `rating.submitted`        | `ratings` INSERT                                 | `{}` — uses `NEW.from_user_id`                                                                              |
| `group.created`           | `group_members` INSERT (where `role = 'admin'`)  | `{}` — `groups` has no user ID column; the creator is the first admin member, uses `NEW.user_id`            |
| `group.joined`            | `group_members` INSERT (where `role = 'member'`) | `{}` — uses `NEW.user_id`                                                                                   |
| `photo.uploaded`          | `item_photos` / `bike_photos` INSERT             | `{ type: 'item' \| 'bike' }` — requires JOIN to `items.owner_id` or `bikes.owner_id` to get user ID         |

#### Client-side (direct insert)

| Event type         | When                    | Metadata           |
| ------------------ | ----------------------- | ------------------ |
| `app.open`         | `AppState` → active     | `{}`               |
| `user.login`       | After successful OAuth  | `{ provider }`     |
| `page.visit`       | Expo Router path change | `{ screen }`       |
| `search.performed` | After search query      | `{ result_count }` |

#### Edge function events

| Event type         | Where                     | Notes               |
| ------------------ | ------------------------- | ------------------- |
| `account.deleted`  | `delete-account` function | Service role insert |
| `export.requested` | `request-export` function | Service role insert |

### Server-side trigger implementation

Shared helper function:

```sql
CREATE OR REPLACE FUNCTION log_analytics_event(
  p_user_id uuid,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO analytics_events (anonymous_id, event_type, status, metadata)
  VALUES (
    encode(digest(p_user_id::text || current_setting('app.analytics_secret'), 'sha256'), 'hex'),
    p_event_type,
    'success',
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

The hashing secret is stored via `ALTER DATABASE postgres SET app.analytics_secret = '...'` (or Supabase Vault in production).

Each table gets a trigger function that calls `log_analytics_event` with the appropriate user ID column and metadata.

**Column mapping for user IDs:**

- `profiles` → `NEW.id`
- `items` → `NEW.owner_id`
- `bikes` → `NEW.owner_id`
- `conversation_participants` → `NEW.user_id`
- `messages` → `NEW.sender_id`
- `reports` → `NEW.reporter_id`
- `borrow_requests` → `NEW.requester_id`
- `ratings` → `NEW.from_user_id`
- `group_members` → `NEW.user_id`
- `item_photos` → JOIN `items` on `NEW.item_id` to get `owner_id`
- `bike_photos` → JOIN `bikes` on `NEW.bike_id` to get `owner_id`

## SQL Views (Dashboard)

All views are accessible via Supabase Studio with service role.

### `v_daily_events` — daily counts per event type and status

```sql
SELECT date_trunc('day', created_at) AS day,
       event_type, status, count(*)
FROM analytics_events GROUP BY 1, 2, 3;
```

### `v_daily_active_users` — unique anonymous users per day

```sql
SELECT date_trunc('day', created_at) AS day,
       count(DISTINCT anonymous_id) AS active_users
FROM analytics_events GROUP BY 1;
```

### `v_daily_errors` — error breakdown

```sql
SELECT date_trunc('day', created_at) AS day,
       event_type, error_message, count(*)
FROM analytics_events WHERE status = 'error' GROUP BY 1, 2, 3;
```

### `v_page_visits` — screen popularity

```sql
SELECT metadata->>'screen' AS screen,
       date_trunc('day', created_at) AS day,
       count(*) AS visits,
       count(DISTINCT anonymous_id) AS unique_visitors
FROM analytics_events WHERE event_type = 'page.visit' GROUP BY 1, 2;
```

### `v_totals` — current aggregate counts from source tables

```sql
SELECT
  (SELECT count(*) FROM items) AS total_items,
  (SELECT count(*) FROM item_photos) + (SELECT count(*) FROM bike_photos) AS total_photos,
  (SELECT count(*) FROM messages) AS total_messages,
  (SELECT count(*) FROM reports) AS total_reports,
  (SELECT count(*) FROM bikes) AS total_bikes,
  (SELECT count(*) FROM conversations) AS total_conversations,
  (SELECT count(*) FROM profiles) AS total_users,
  (SELECT count(*) FROM borrow_requests) AS total_borrow_requests;
```

### `v_active_users_summary` — 7/30 day active users

```sql
SELECT
  count(DISTINCT anonymous_id) FILTER (WHERE created_at > now() - interval '7 days') AS active_7d,
  count(DISTINCT anonymous_id) FILTER (WHERE created_at > now() - interval '30 days') AS active_30d
FROM analytics_events;
```

## Client-Side Implementation

### Analytics utility (`src/shared/utils/analytics.ts`)

- `generateAnonymousId(userId: string): string` — SHA256 via `expo-crypto` with `EXPO_PUBLIC_ANALYTICS_SECRET`. Cached in memory for the session.
- `trackEvent(eventType: string, metadata?: Record<string, unknown>)` — inserts into `analytics_events`. Fire-and-forget, errors caught silently. Analytics must never break the app.
- `trackError(eventType: string, errorMessage: string, metadata?: Record<string, unknown>)` — convenience wrapper, sets `status: 'error'`.

### Integration points

| Event              | Where              | How                                |
| ------------------ | ------------------ | ---------------------------------- |
| `app.open`         | Root `_layout.tsx` | `AppState` change to `active`      |
| `user.login`       | Auth flow          | After successful `signInWithOAuth` |
| `page.visit`       | Root `_layout.tsx` | `usePathname()` change listener    |
| `search.performed` | Search hook        | After successful query             |

### No offline queuing

Analytics events are best-effort. Lost events when offline are acceptable. The existing `useOfflineQueue` is reserved for mutations that matter (items, messages).

## Error Tracking Strategy

| Error type                    | Destination             | Examples                                                        |
| ----------------------------- | ----------------------- | --------------------------------------------------------------- |
| Code bugs (shouldn't happen)  | Sentry + `trackError()` | RLS violation on own data, unhandled exception, data corruption |
| Operational errors (expected) | `trackError()` only     | Network timeout, Supabase connection failure, rate limit hit    |

Decision is made at the call site — feature hooks know whether an error is expected or unexpected.

## Data Retention

No automatic cleanup initially. If the table grows large, a monthly cron via `pg_cron` can delete events older than 12 months. Decide later based on volume.

## Migration

Single migration file:

1. Enable `pgcrypto` extension (if not already enabled)
2. Create `analytics_events` table with indexes
3. Set `app.analytics_secret` config parameter
4. Create `log_analytics_event()` helper function
5. Create all trigger functions and triggers
6. Create SQL views
7. Enable RLS with INSERT-only policy for authenticated users

## Future Considerations

Client-side events (app open, page visits, login, search) could alternatively be captured by an external product analytics service such as PostHog, which is Expo Go compatible and offers a 1M events/month free tier. PostHog provides richer visualization (funnels, retention, session replay) out of the box and has a Supabase data warehouse integration that can join PostHog behavioral data with Postgres tables.

Server-side trigger events are best kept in Postgres regardless, as Postgres triggers naturally write to the local database. A hybrid approach — PostHog for client-side, custom table for server-side — is a viable future evolution.

If the Supabase Studio SQL views become insufficient, the `analytics_events` table can be synced to PostHog, Grafana, or a lightweight custom web dashboard without changing the underlying instrumentation.
