# Bike Bin — Data Model

> **Purpose:** Entities, main fields, relationships, and where they are defined in code and SQL.  
> **TypeScript models:** `src/shared/types/` (`models.ts`, `enums.ts`, `ids.ts`).  
> **Database:** `supabase/migrations/*.sql` — migrations are authoritative for columns, enums, and RLS.

---

## ID types (branded)

The app uses branded string types for IDs (e.g. `UserId`, `ItemId`, `BikeId`, `GroupId`, `ConversationId`, `MessageId`, `LocationId`, `BorrowRequestId`, `RatingId`, `NotificationId`, `ItemPhotoId`, `BikePhotoId`, `ReportId`, `SupportRequestId`) to avoid mixing IDs across tables.

---

## Core entities

### `profiles` → `UserProfile`

Extends Supabase Auth users (`auth.users`). Public app profile: `display_name`, `avatar_url`, rating aggregates, notification preferences, optional `push_token`, `distance_unit` (see migrations for full column set). Primary key `id` = `auth.users.id`.

### `saved_locations` → `SavedLocation`

User-owned pickup areas: label, optional `area_name`, `postcode`, **PostGIS** `geography(Point, 4326)` for coordinates, `is_primary`. Used for item pickup and distance-based search.

### `items` → `Item`

Inventory rows: owner, name, `category`, `subcategory` (free text), brand, model, description, `condition`, `status`, `availability_types` (text array), optional price/deposit/borrow metadata, `storage_location`, `age`, optional `usage_km` and `usage_unit` (km or mi; both unset when distance is not tracked), optional **`remaining_fraction`** (0–1 for consumables; NULL for other categories or when unset), `purchase_date`, optional `pickup_location_id`, `visibility` (defaults to `private`), optional `bike_id`, **`tags`** (text array, max 20 items / 50 chars each, enforced by DB constraint + trigger). Timestamps for create/update.

The TS model also carries `thumbnailStoragePath` — this is **not** a DB column; it is resolved client-side by fetching the first `item_photos` row for the item.

Related: **`item_photos`**, **`item_groups`** (many-to-many with `groups`).

### `item_photos` → `ItemPhoto`

Ordered photos for an item; `storage_path` points at Supabase Storage.

### `bikes` → `Bike`

User-owned bikes: name, brand, model, `type` enum, optional year. TS model also has `thumbnailStoragePath` (resolved client-side, like items).

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

Defined in migrations (with later `ALTER TYPE ... ADD VALUE` updates):

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

All user-facing tables use **Row Level Security**. Policy definitions live in migration files (e.g. `00004_rls_policies.sql` and later fixes). **Items:** extra policy + trigger for owner **loaned/reserved → stored** and borrow-lock edits (`00029_items_owner_return_from_loan.sql`). **borrow_requests:** UPDATE allowed for requester or owner; status transitions enforced by trigger (`00030_borrow_requests_update_trigger.sql`) — see [design-docs/016-rls-security.md](design-docs/016-rls-security.md). When adding tables or columns, add matching policies — see [security.md](security.md).

---

## Keeping this doc current

After schema changes: update this file briefly and ensure `src/shared/types/models.ts` stays aligned with PostgREST responses (including renames to camelCase in the API layer if used).
