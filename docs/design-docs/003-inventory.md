# Inventory

## Overview

The core feature of Bike Bin—the **primary use case** is managing your own collection. Users manage their personal collection of bike parts, tools, accessories, consumables, and clothing. **Sharing, selling, and group visibility** are secondary: they layer on when users choose to list or scope items beyond private inventory. Each item has a category, subcategory, condition (non-consumables) or **amount remaining** (consumables via `remaining_fraction`), status (lifecycle state), availability types (borrow/donate/sell), visibility (private/groups/public), photos, and private tags. The inventory list hides terminal items (archived/sold/donated) by default with a toggle to reveal them.

## Data Model

### items table

| Column             | Type                        | Description                                                                             |
| ------------------ | --------------------------- | --------------------------------------------------------------------------------------- |
| id                 | uuid (PK)                   | ItemId branded type                                                                     |
| owner_id           | uuid (FK → profiles)        | Item owner                                                                              |
| name               | text                        | Item name                                                                               |
| category           | item_category enum          | component, tool, accessory, consumable, clothing, bike                                  |
| subcategory        | text                        | Free-text subcategory within parent category                                            |
| condition          | item_condition enum         | new, good, worn, broken (consumables default to good in DB; UI uses remaining_fraction) |
| remaining_fraction | numeric                     | For consumables: fraction left 0–1; NULL otherwise                                      |
| status             | item_status enum            | stored, mounted, loaned, reserved, donated, sold, archived                              |
| availability_types | text[]                      | Array of: borrowable, donatable, sellable, private                                      |
| visibility         | item_visibility enum        | private, groups, all                                                                    |
| brand              | text                        | Manufacturer/brand                                                                      |
| model              | text                        | Model name                                                                              |
| description        | text                        | Free-text description                                                                   |
| price              | numeric                     | Selling price (required when sellable)                                                  |
| deposit            | numeric                     | Borrow deposit amount                                                                   |
| borrow_duration    | text                        | Suggested borrow duration                                                               |
| storage_location   | text                        | Where the item is stored                                                                |
| age                | text                        | Predefined age range key                                                                |
| usage              | numeric                     | Usage in kilometers                                                                     |
| usage_unit         | text                        | Unit for usage                                                                          |
| purchase_date      | date                        | Optional bought/purchase date (YYYY-MM-DD)                                              |
| mounted_date       | date                        | Optional date mounted on a bike (independent of `status`)                               |
| pickup_location_id | uuid (FK → saved_locations) | Pickup location                                                                         |
| bike_id            | uuid (FK → bikes)           | Bike this part is mounted on                                                            |
| tags               | text[]                      | Private user tags (max 20)                                                              |
| created_at         | timestamptz                 | Creation timestamp                                                                      |
| updated_at         | timestamptz                 | Last update timestamp                                                                   |

### item_photos table

| Column       | Type              | Description           |
| ------------ | ----------------- | --------------------- |
| id           | uuid (PK)         | Photo ID              |
| item_id      | uuid (FK → items) | Parent item           |
| storage_path | text              | Supabase Storage path |
| sort_order   | integer           | Display order         |
| created_at   | timestamptz       | Upload timestamp      |

### item_groups junction table

| Column   | Type               | Description                  |
| -------- | ------------------ | ---------------------------- |
| item_id  | uuid (FK → items)  | Item                         |
| group_id | uuid (FK → groups) | Group for visibility scoping |

Composite primary key: `(item_id, group_id)`.

### Enums

- **item_category:** component, tool, accessory, consumable, clothing, bike
- **item_condition:** new, good, worn, broken
- **item_status:** stored, mounted, loaned, reserved, donated, sold, archived
- **item_visibility:** private, groups, all

### Subcategories

Defined in `src/features/inventory/constants.ts`. Each category has a predefined list of subcategory keys that map to i18n strings. For example, `component` has: drivetrain, brakes, wheels, tires_tubes, handlebars_stems, seatposts_saddles, suspension, frames, headsets_bearings, pedals, bottom_brackets, cables_housing. Each subcategory has an associated MaterialCommunityIcons icon.

## Architecture

```
src/features/inventory/
├── components/
│   ├── CategoryFilter/
│   │   └── CategoryFilter.tsx       # Category chip filter bar
│   ├── ItemCard/
│   │   └── ItemCard.tsx             # List item card with thumbnail
│   ├── ItemDetail/
│   │   └── ItemDetail.tsx           # Full item detail view
│   ├── RemoveFromInventoryDialog/
│   │   └── RemoveFromInventoryDialog.tsx  # Archive vs delete chooser (Paper Dialog + theme tokens; web-safe)
│   ├── ItemForm/
│   │   └── ItemForm.tsx             # Create/edit form
│   └── PhotoPicker/
│       └── PhotoPicker.tsx          # Photo selection UI
├── hooks/
│   ├── useItems.ts                  # CRUD queries + mutations (TanStack Query)
│   ├── usePhotoUpload.ts            # Photo upload to Supabase Storage
│   ├── usePhotoPicker.ts            # Image picker integration
│   ├── useStagedPhotos.ts           # Manages photos before save
│   └── useUserTags.ts              # Distinct user tags for autocomplete
├── utils/
│   ├── status.ts                    # Status helpers: canDelete, canUnarchive, canEditAvailability, isTerminalStatus, getStatusColor
│   ├── validation.ts                # ItemFormData type + validateItem
│   ├── availabilityList.ts          # Filter private from availability chips
│   └── tagUtils.ts                  # Tag deduplication, formatting
├── constants.ts                      # SUBCATEGORIES, DEFAULT_BRANDS, AGE_OPTIONS, DURATION_OPTIONS
├── types.ts                          # Re-exports ItemFormData/ItemFormErrors
└── index.ts                          # Public API
```

### Key hooks

- **useItems()** — fetches all items for the current user, ordered by updated_at, with thumbnail paths
- **useItem(id)** — fetches a single item
- **useItemPhotos(itemId)** — fetches photos for an item, ordered by sort_order
- **useCreateItem()** — inserts item + syncs item_groups if visibility is "groups"
- **useUpdateItem()** — updates item + re-syncs item_groups
- **useUpdateItemStatus()** — changes item status (lifecycle transitions)
- **useDeleteItem()** — deletes item (blocked for loaned/reserved statuses)
- **useUserTags()** — fetches distinct tags across user's items for autocomplete
- **usePhotoUpload()** — uploads photos to Supabase Storage

### Status rules

- **Terminal statuses:** archived, sold, donated — hidden from inventory list by default
- **Non-deletable:** loaned, reserved — cannot be deleted while in these states
- **Unarchive:** `canUnarchive(item)` is true only when `status === archived`. **Restore to inventory** sets status to **stored** via `useUpdateItemStatus` (same RLS path as other owner updates; not borrow-locked).
- **Status colors:** loaned/reserved → warning, donated/sold → success, others → outline

## Screens & Navigation

| Route                                | Screen         | Purpose                                                 |
| ------------------------------------ | -------------- | ------------------------------------------------------- |
| `(tabs)/inventory/index.tsx`         | Inventory List | Main list with category filter, search, terminal toggle |
| `(tabs)/inventory/[id].tsx`          | Item Detail    | Full item view with photos, status actions              |
| `(tabs)/inventory/new.tsx`           | New Item       | Item creation form                                      |
| `(tabs)/inventory/edit/[id].tsx`     | Edit Item      | Item edit form                                          |
| `(tabs)/inventory/notifications.tsx` | Notifications  | Notification list (in inventory tab)                    |

The inventory list header includes a **Bikes →** control that opens the **Bikes** tab (`(tabs)/bikes`) for quick access to bike management.

## Key Flows

### Adding an Item

1. User taps "+" on inventory list → navigates to `new.tsx`
2. Fills in ItemForm: name (required), category (required), condition (required), optional fields
3. Selects availability types (borrow/donate/sell)
4. Optionally sets visibility (private/groups/all) and selects groups
5. Optionally adds photos via PhotoPicker
6. Optionally adds private tags
7. `useCreateItem` mutation → inserts to `items` table + syncs `item_groups`
8. Invalidates queries → returns to inventory list

### Status Transitions (Availability-Gated Actions)

Actions on item detail are gated by both **status** and **availability types**:

| Action                    | Requires availability | Status gate                                     |
| ------------------------- | --------------------- | ----------------------------------------------- |
| Mark sold                 | Sell                  | Stored or mounted                               |
| Mark donated              | Donate                | Stored or mounted                               |
| Mark loaned               | Borrow                | Stored or mounted                               |
| Mark returned             | Borrow                | Loaned                                          |
| **Restore to inventory**  | —                     | **Archived** only → sets **stored** (unarchive) |
| **Remove from inventory** | —                     | Opens chooser dialog (see below)                |

**Remove from inventory** (`(tabs)/inventory/[id].tsx`): opens **`RemoveFromInventoryDialog`** — a **React Native Paper** `Portal` + `Dialog` styled with shared **theme tokens** (`surface`, `surfaceContainerLow`, `borderRadius`, `spacing`). Actions inside the dialog:

- **Archive** — shown when the item is **not** already archived; then the existing archive confirmation (`Alert` on native, `window.confirm` on web).
- **Delete item** — shown when `canDelete(item)` (not loaned/reserved); then the existing delete confirmation.
- **Cancel** — closes the dialog (`common.actions.cancel`).

Using a Dialog instead of a multi-button `Alert.alert` avoids **no-op alerts on web** and matches app chrome.

**Archived items** still see **Remove from inventory** when delete is allowed (delete-only in the dialog). They also see **Restore to inventory** as a primary **GradientButton** on the detail screen.

"Mark loaned" allows informal/offline loans without a formal borrow request.

**Mark returned (implementation):** On item detail, if an **accepted** borrow request exists for the item, the app calls **`useMarkReturned`** (updates `borrow_requests` to `returned` and item to `stored`). Otherwise it uses **`useUpdateItemStatus`** to set `stored` only (informal loan). See [006-borrow.md](006-borrow.md).

### Terminal Item Filtering

- Default: terminal items (archived, sold, donated) hidden from inventory list
- When terminal items exist: a filter chip appears with count (e.g., "Archived (3)")
- Toggling the chip reveals terminal items
- Filter resets when no terminal items remain in the working set
- Filtering is client-side on the full inventory payload

### Tags

- Private free-text tags stored as string array on item row (max 20)
- Tags are never shown to other users or included in search
- Autocomplete suggests from user's existing tags (deduplicates case-insensitively)
- Inventory list supports filtering by tags (OR within tags, AND with text search)

## RLS & Security

| Policy                                   | Operation | Rule                                                                   |
| ---------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `items_select_public`                    | SELECT    | Public items (visibility = 'all') readable by all authenticated users  |
| `items_insert_own`                       | INSERT    | Users can only insert items with `owner_id = auth.uid()`               |
| `items_update_own`                       | UPDATE    | Own items; not while loaned/reserved (except see release policy below) |
| `items_update_owner_release_borrow_lock` | UPDATE    | Own item: **loaned or reserved → stored** only (migration 00029)       |
| `items_delete_own`                       | DELETE    | Own items; not while loaned or reserved                                |

Borrow-lock trigger (`00029`) prevents arbitrary column changes while status stays loaned/reserved. Full policy inventory: [016-rls-security.md](016-rls-security.md).

Group-scoped visibility is enforced via `item_groups` junction + group membership checks.

Tags privacy: the `tags` column is readable via generic item SELECT policies, but no client API or search endpoint exposes tags to non-owners.

## i18n

Namespace: `inventory`

Key areas: `form.*` (field labels, placeholders, validation), `status.*` (status labels), `category.*` (category names), `subcategory.*` (subcategory names), `detail.*` (detail screen labels, including **remove / restore** copy), `confirm.unarchive.*` (restore confirmation), `removeFromInventory` (button label), `list.*` (list screen labels), `tags.*` (tag UI), `filter.*` (filter labels).

Also uses `common` namespace for shared action labels.

## Current Status

- **Implemented:** Full CRUD, photo upload, category/subcategory system with 70+ subcategories, status lifecycle with availability-gated actions, **Remove from inventory** dialog (archive/delete chooser) + **Restore to inventory** (unarchive archived → stored), private tags with autocomplete, terminal item hiding, visibility scoping (private/groups/all), brand suggestions (60+ default brands), age and duration options, form validation
- **Working:** All status transitions above, photo management, tag filtering, group visibility syncing
- **Known limitations:** Price validation only checks presence for sellable items (no currency formatting), usage tracking is basic (km only)
