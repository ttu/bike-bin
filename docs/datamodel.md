# Bike Bin — Data Model

> **Purpose:** Entities, main fields, relationships, and where they are defined in code and SQL.  
> **TypeScript models:** `src/shared/types/` (`models.ts`, `enums.ts`, `ids.ts`).  
> **Database:** `supabase/migrations/*.sql` — migrations are authoritative for columns, enums, and RLS.

---

## ID types (branded)

The app uses branded string types for IDs (e.g. `UserId`, `ItemId`, `BikeId`, `GroupId`, `ConversationId`, `MessageId`, `LocationId`, `BorrowRequestId`, `RatingId`, `NotificationId`, `ItemPhotoId`, `BikePhotoId`, `ReportId`, `SupportRequestId`, `SubscriptionId`) to avoid mixing IDs across tables.

---

## Core entities

### `profiles` → `UserProfile`

Extends Supabase Auth users (`auth.users`). Public app profile: `display_name`, `avatar_url`, rating aggregates, notification preferences, optional `push_token`, `distance_unit` (see migrations for full column set). Primary key `id` = `auth.users.id`.

### `subscriptions` → subscription row

Per-user subscription and billing-related state: `plan` (`subscription_plan`), `status` (`subscription_status`), optional billing period bounds (`current_period_start`, `current_period_end`), cancel flags, optional `provider` / `provider_subscription_id` / `provider_customer_id`, `metadata` jsonb. Multiple rows per user over time are allowed; at most one row per user may be in an entitled status (`trialing`, `active`, `past_due`) — enforced by a partial unique index. **RLS:** users may **SELECT** only their own rows; **INSERT/UPDATE/DELETE** are not granted via PostgREST policies (service role, Edge Functions, or SQL in the dashboard). Treat **no entitled row** as free-tier behavior in app logic.

### `saved_locations` → `SavedLocation`

User-owned pickup areas: label, optional `area_name`, `postcode`, **PostGIS** `geography(Point, 4326)` for coordinates, `is_primary`. Used for item pickup and distance-based search.

### `items` → `Item`

Inventory rows: owner, name, `category`, `subcategory` (free text), brand, model, description, `condition`, **`quantity`** (integer ≥ 1, how many identical units this row represents; default 1), `status`, `availability_types` (text array), optional price/deposit/borrow metadata, `storage_location`, `age`, optional `usage` and `usage_unit` (km or mi; both unset when distance is not tracked), optional **`remaining_fraction`** (0–1 for consumables; NULL for other categories or when unset), optional **`purchase_date`** (bought date), optional **`mounted_date`** (calendar date mounted on a bike; independent of `item_status`), optional `pickup_location_id`, `visibility` (defaults to `private`), optional `bike_id`, **`tags`** (text array, max 20 items / 50 chars each, enforced by DB constraint + trigger). Timestamps for create/update.

The TS model also carries `thumbnailStoragePath` — this is **not** a DB column; it is resolved client-side by fetching the first `item_photos` row for the item.

Related: **`item_photos`**, **`item_groups`** (many-to-many with `groups`).

**Lifecycle (app):** Owners may set `status` to **`archived`** or back to **`stored`** (unarchive) when RLS allows updates — see `items_update_own` (not loaned/reserved) and migration **`00029`** for borrow-lock exceptions. Product behavior for **Remove from inventory** / **Restore** is documented in [design-docs/003-inventory.md](design-docs/003-inventory.md).

### `item_photos` → `ItemPhoto`

Ordered photos for an item; `storage_path` points at Supabase Storage.

### `bikes` → `Bike`

User-owned bikes: name, brand, model, `type` enum, optional year, optional **`distance_km`** and **`usage_hours`** (numeric), **`condition`** (`item_condition`, same enum as items; default `good`), optional **`notes`** (free text). TS model also has `thumbnailStoragePath` (resolved client-side, like items).

### `bike_photos` → `BikePhoto`

Ordered photos for a bike (mirrors `item_photos` structure). RLS scoped to bike owner.

### `groups` / `group_members` → `Group`, `GroupMember`

Groups with optional public flag; members have a `role` (e.g. admin vs member).

### `item_groups`

Junction: which groups may see an item when visibility is group-scoped.

### `borrow_requests` → `BorrowRequest`

Per-item borrow workflow: requester, `status` enum, optional message, timestamps.

### `conversations` / `conversation_participants` / `messages`

Item-linked (or general) chat: `conversations` may reference `item_id`; `messages` store `sender_id` and `body`. Realtime typically filters by conversation membership.

### `ratings` → `Rating`

From/to users, optional `item_id`, `transaction_type`, score 1–5, optional text, `editable_until`.

### `notifications` → `Notification`

Per-user rows: `type`, title, body, `data` jsonb, `is_read`.

### `support_requests` → `SupportRequest`

User feedback: subject, body, optional screenshot path, app metadata, `status`.

### `reports` → `Report`

Moderation: reporter, target type/id, reason, `status`.

### `geocode_cache`

Server-side utility table (no RLS): caches Nominatim geocoding results for postcodes. Used by the `geocode-postcode` Edge Function.

---

## PostgreSQL enums

Each enum is created with its feature migration (e.g. `subscription_*` in `00002_auth_profiles_locations.sql`, `item_*` / `group_role` in `00004_groups_items.sql`). Later changes use `ALTER TYPE ... ADD VALUE` in new migrations.

| SQL enum                | Values (current)                                                         |
| ----------------------- | ------------------------------------------------------------------------ |
| `item_category`         | `component`, `tool`, `accessory`, `consumable`, `clothing`, `bike`       |
| `item_condition`        | `new`, `good`, `worn`, `broken`                                          |
| `item_status`           | `stored`, `mounted`, `loaned`, `reserved`, `donated`, `sold`, `archived` |
| `item_visibility`       | `private`, `groups`, `all`                                               |
| `bike_type`             | `road`, `gravel`, `mtb`, `city`, `touring`, `other`                      |
| `group_role`            | `admin`, `member`                                                        |
| `borrow_request_status` | `pending`, `accepted`, `rejected`, `returned`, `cancelled`               |
| `transaction_type`      | `borrow`, `donate`, `sell`                                               |
| `support_status`        | `open`, `closed`                                                         |
| `report_target_type`    | `item`, `user`                                                           |
| `report_status`         | `open`, `reviewed`, `closed`                                             |
| `subscription_plan`     | `free`, `paid`                                                           |
| `subscription_status`   | `trialing`, `active`, `past_due`, `canceled`, `expired`                  |

TypeScript const-object enums in `src/shared/types/enums.ts` align with these. A few TS-only constructs exist that are **not** PG enums (stored as `text` / `text[]` in the DB):

- `AvailabilityType` (`borrowable`, `donatable`, `sellable`, `private`) — `items.availability_types` is `text[]`.
- `NotificationType` — `notifications.type` is `text`.

---

## Storage buckets

Image buckets (e.g. item and bike photos) are created and secured in migrations / Storage policies — see `supabase/migrations/` files referencing `storage` and bucket names.

---

## RPC and helpers

Migrations may define **SECURITY DEFINER** functions (e.g. tag autocomplete, search/distance helpers). Prefer calling these via Supabase client `.rpc()` where exposed.

---

## RLS

All user-facing tables use **Row Level Security**. Policy definitions live in **`supabase/migrations/`** using one file per domain (DDL + RLS + triggers and/or Realtime where applicable): `00002_auth_profiles_locations.sql` (includes profile-on-signup trigger), `00003_bikes.sql`, `00004_groups_items.sql` (group/item helpers + policies + item triggers), `00005_borrow_requests.sql` (borrow update trigger), `00006_messaging.sql` (Realtime on `messages`), `00007_ratings.sql` (rating aggregate trigger), `00008_notifications.sql` (Realtime on `notifications`), `00009_support_reports.sql`, `00010_geocode_cache.sql`, `00011_export_requests_storage.sql`, then RPC helpers (`00012_functions_business.sql`, `00013_functions_search_listing.sql`), `item-photos` storage (`00014_storage_item_photos.sql`). **subscriptions:** authenticated users may **SELECT** only rows where `user_id = auth.uid()`; **INSERT/UPDATE/DELETE** are not exposed to the anon/authenticated PostgREST roles — use the **service role** (Edge Functions, webhooks) or SQL in the Supabase dashboard. **Items:** policies + triggers for owner updates, including borrow-lock rules. **borrow_requests:** UPDATE allowed for requester or owner; status transitions enforced by trigger — see [design-docs/016-rls-security.md](design-docs/016-rls-security.md). When adding tables or columns, add matching policies — see [security.md](security.md).

---

## Keeping this doc current

After schema changes: update this file briefly and ensure `src/shared/types/models.ts` stays aligned with PostgREST responses (including renames to camelCase in the API layer if used).
