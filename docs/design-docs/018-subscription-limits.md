# Subscription Limits

## Overview

Subscription-based row limits enforce per-user caps on inventory items, bikes, and photos. Free-tier users have generous but bounded limits (500 items, 15 bikes, 100 photos); paid subscribers get high caps (10,000 each). Enforcement happens at two layers: **database triggers** prevent inserts beyond the cap, and **client-side capacity hooks** proactively disable creation UI when limits are reached.

## Tier Limits

| Resource                             | Free | Paid   |
| ------------------------------------ | ---- | ------ |
| Inventory items (`items` rows)       | 500  | 10,000 |
| Bikes (`bikes` rows)                 | 15   | 10,000 |
| Photos (`item_photos + bike_photos`) | 100  | 10,000 |

A user has an "entitled paid" subscription when `subscriptions.plan = 'paid'` AND `subscriptions.status` IN (`trialing`, `active`, `past_due`).

## Architecture

```
supabase/migrations/
└── 00015_inventory_item_subscription_limit.sql  # All DB functions + triggers

src/features/inventory/hooks/
├── useInventoryRowCapacity.ts    # Item count vs limit
├── useMyInventoryItemLimit.ts    # RPC: get_my_inventory_item_limit()
└── useStagedPhotos.ts            # Pre-upload photo limit check

src/features/bikes/hooks/
├── useBikeRowCapacity.ts         # Bike count vs limit
└── useMyBikeLimit.ts             # RPC: get_my_bike_limit()

src/shared/hooks/
└── usePhotoRowCapacity.ts        # Combined photo count vs limit (RPC)

src/shared/utils/
└── subscriptionLimitErrors.ts    # Error type guards for limit violations
```

### Database Layer

**Limit functions** — `SECURITY DEFINER`, `STABLE`, `search_path = public`:

| Function                               | Returns | Purpose                                    |
| -------------------------------------- | ------- | ------------------------------------------ |
| `subscription_has_entitled_paid(uuid)` | boolean | Check if user has active paid subscription |
| `inventory_item_limit_for_user(uuid)`  | integer | Item cap for a given user                  |
| `bike_limit_for_user(uuid)`            | integer | Bike cap for a given user                  |
| `photo_limit_for_user(uuid)`           | integer | Photo cap for a given user                 |
| `user_photo_count(uuid)`               | bigint  | Combined item_photos + bike_photos count   |
| `get_my_inventory_item_limit()`        | integer | Authenticated wrapper (client-callable)    |
| `get_my_bike_limit()`                  | integer | Authenticated wrapper (client-callable)    |
| `get_my_photo_limit()`                 | integer | Authenticated wrapper (client-callable)    |
| `get_my_photo_count()`                 | integer | Authenticated wrapper (client-callable)    |

Internal functions (`*_for_user`, `user_photo_count`) are `REVOKE ALL FROM PUBLIC`. Client-callable `get_my_*` functions are granted to `authenticated` role only.

**Statement-level triggers** — enforce limits after insert, using `REFERENCING NEW TABLE AS`:

| Trigger                                 | Table         | Function                              |
| --------------------------------------- | ------------- | ------------------------------------- |
| `trg_items_enforce_inventory_row_limit` | `items`       | `enforce_items_inventory_row_limit()` |
| `trg_bikes_enforce_row_limit`           | `bikes`       | `enforce_bikes_row_limit()`           |
| `trg_item_photos_enforce_account_limit` | `item_photos` | `enforce_item_photos_account_limit()` |
| `trg_bike_photos_enforce_account_limit` | `bike_photos` | `enforce_bike_photos_account_limit()` |

Each trigger:

1. Groups inserted rows by `owner_id` (joining through parent table for photos)
2. Acquires `pg_advisory_xact_lock(hashtext('<table>_limit'), hashtext(owner_id))` to prevent race conditions
3. Checks post-insert count against the user's limit
4. Raises exception with `ERRCODE = '23514'` and a descriptive message (`inventory_limit_exceeded`, `bike_limit_exceeded`, `photo_limit_exceeded`)

Statement-level triggers (vs row-level) prevent bulk insert bypass — a single multi-row INSERT is checked as one batch.

### Client Layer

**Capacity hooks** — each returns `{ atLimit, count, limit, isReady }`:

- **`useInventoryRowCapacity()`** — compares `useItems().length` to `get_my_inventory_item_limit()` RPC
- **`useBikeRowCapacity()`** — compares `useBikes().length` to `get_my_bike_limit()` RPC
- **`usePhotoRowCapacity()`** — calls `get_my_photo_count()` and `get_my_photo_limit()` RPCs in parallel

Unauthenticated users always see `atLimit: false`.

**Screen integration:**

| Screen                         | Behavior when at limit                                   |
| ------------------------------ | -------------------------------------------------------- |
| Inventory list (`inventory/`)  | FAB disabled, empty state shows limit message            |
| Bikes list (`bikes/`)          | FAB disabled, empty state shows limit message            |
| New item (`inventory/new.tsx`) | Photo upload checks remaining capacity before staging    |
| Item detail (`inventory/[id]`) | Photo limit warning shown via URL parameter after upload |

**Error handling** — `subscriptionLimitErrors.ts` provides type guards:

- `isInventoryLimitExceededError(error)` — matches `23514` + `inventory_limit_exceeded`
- `isBikeLimitExceededError(error)` — matches `23514` + `bike_limit_exceeded`
- `isPhotoLimitExceededError(error)` — matches `23514` + `photo_limit_exceeded` OR `PhotoLimitExceededError` instance

`PhotoLimitExceededError` is thrown client-side in `useStagedPhotos` when a batch upload would exceed the account photo cap (pre-flight check before hitting the database).

## RLS Tests

| Test file                       | Coverage                                              |
| ------------------------------- | ----------------------------------------------------- |
| `inventory-limit.rls.test.ts`   | Free-tier item insert at/over limit                   |
| `bikes-limit.rls.test.ts`       | Free-tier bike insert at/over limit                   |
| `photos-limit.rls.test.ts`      | Item photo insert at/over limit, cross-table counting |
| `bike-photos-limit.rls.test.ts` | Bike photo insert at/over limit                       |

## i18n

Keys under `inventory` and `bikes` namespaces:

- `limit.emptyStateDescription` — shown when creation is blocked (interpolates `{{limit}}`)
- `limit.reachedFabA11y` — accessibility label for disabled FAB
- Photo limit warnings use snackbar messaging on detail screens

## Design Decisions

1. **Statement-level triggers over row-level** — row-level `BEFORE INSERT` triggers check one row at a time, allowing bulk inserts to bypass the limit. Statement-level `AFTER INSERT` triggers see the full batch and can enforce accurately.

2. **Advisory locks per user** — `pg_advisory_xact_lock` with `hashtext(owner_id)` serializes concurrent inserts for the same user, preventing TOCTOU races while allowing unrelated users to insert in parallel.

3. **SECURITY DEFINER functions** — limit functions use `SECURITY DEFINER` so RLS doesn't interfere with cross-table counting (e.g., `user_photo_count` joins items/bikes with their photos).

4. **Client-side pre-flight** — capacity hooks disable UI proactively to avoid unnecessary server round-trips and error handling. The database triggers remain the authoritative enforcement layer.

5. **Combined photo budget** — item photos and bike photos share one pool rather than separate caps, simplifying the mental model for users.

6. **Error code `23514`** — reuses PostgreSQL's check_violation code so PostgREST surfaces it as a structured error that client-side type guards can match reliably.
