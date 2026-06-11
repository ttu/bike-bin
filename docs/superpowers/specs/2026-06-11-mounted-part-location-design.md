# Mounted parts derive their location from the bike

**Date:** 2026-06-11
**Branch:** `feat/mounted-part-location`
**Status:** Approved (design)

## Summary

When a bike part (an `items` row) is mounted on a bike, its location must be the
bike's name. While the part stays mounted the location is system-controlled: it
is derived from the bike, kept in sync if the bike is renamed, and cleared when
the part is detached. The user cannot edit the location from the item edit form
while the part is mounted.

This is enforced in the database (triggers) so it holds for every client and
every write path, and reinforced in the edit UI so the rule is visible to users.

## Domain background

- An item is mounted via `useAttachPart` (`src/features/bikes/hooks/useAttachPart.ts`),
  which sets `items.bike_id = <bikeId>` and `items.status = 'mounted'`.
- It is detached via `useDetachPart`, which sets `bike_id = null` and
  `status = 'stored'`.
- `items.bike_id` is `uuid REFERENCES bikes(id) ON DELETE SET NULL`
  (`supabase/migrations/00004_groups_items.sql`).
- `items.status` is the `item_status` enum
  (`'stored' | 'mounted' | 'loaned' | 'reserved' | ...`).
- `items.storage_location` is free text.
- An item's location is rendered in **ItemDetail** as `item.storageLocation`
  (`src/features/inventory/components/ItemDetail/ItemDetail.tsx`, the
  `map-marker-outline` location block). This is the only place a location is
  displayed (item cards and search results do not show it).
- The location is edited in the item form via `StorageField` inside
  `OptionalSection` (`src/features/inventory/components/ItemForm/sections/OptionalSection.tsx`).

## Decisions

1. **Persist into `storage_location`** (not display-only derivation). The bike
   name is written into `items.storage_location`.
2. **On detach, clear** `storage_location`. The pre-mount value is not restored.
3. **On bike rename, keep in sync** — all of the bike's mounted parts get the new
   name.
4. **Enforce in the database** via triggers (single source of truth, atomic,
   consistent across clients), matching the existing migration-based business
   logic (`00012_functions_business.sql`, `00015_inventory_item_subscription_limit.sql`).
5. **Lock the edit field** — while mounted, the location field in the item edit
   form is read-only with an explanatory helper text.

## Part A — Database rule

New migration: `supabase/migrations/00022_mounted_part_location.sql`.

### Trigger 1 — on `items`

`BEFORE INSERT OR UPDATE FOR EACH ROW`, function `SECURITY DEFINER` with
`SET search_path = public, pg_temp` (mirrors existing trigger functions).

Logic (operating on `NEW` because it is a BEFORE trigger):

```text
IF NEW.status = 'mounted' AND NEW.bike_id IS NOT NULL THEN
    -- attach, or any write while mounted: lock location to the bike name
    SELECT name INTO NEW.storage_location FROM bikes WHERE id = NEW.bike_id;
ELSIF TG_OP = 'UPDATE'
      AND OLD.status = 'mounted' AND OLD.bike_id IS NOT NULL THEN
    -- was mounted, now isn't (detached, or bike deleted via ON DELETE SET NULL)
    NEW.storage_location := NULL;
    IF NEW.status = 'mounted' THEN
        NEW.status := 'stored';   -- orphaned mount: bike removed, status stale
    END IF;
END IF;
```

Notes:

- While an item is mounted, any update overwrites `storage_location` with the
  bike name. Manual edits to the location are therefore ignored while mounted —
  this is intended ("the location *is* the bike name").
- Bike deletion fires this trigger via `ON DELETE SET NULL` (an UPDATE that nulls
  `bike_id`), so deleting a bike clears its parts' location and resets their
  status to `stored`.

### Trigger 2 — on `bikes`

`AFTER UPDATE OF name FOR EACH ROW WHEN (OLD.name IS DISTINCT FROM NEW.name)`,
function `SECURITY DEFINER`:

```text
UPDATE items
SET storage_location = NEW.name
WHERE bike_id = NEW.id AND status = 'mounted';
```

This UPDATE re-fires Trigger 1 on each affected item, which is idempotent (it
re-derives the same bike name).

### No change to attach/detach hooks or ItemDetail

`useAttachPart` / `useDetachPart` already set `bike_id` and `status`; the trigger
derives `storage_location`. `ItemDetail` already renders `item.storageLocation`,
which now shows the bike name. No code change needed in those files.

## Part B — Edit form lock

While the item is mounted, the location field is read-only.

- `app/(tabs)/inventory/edit/[id].tsx` computes
  `locationLocked = item.status === ItemStatus.Mounted && item.bikeId !== undefined`
  and passes it as a new prop to `ItemForm`.
- `locationLocked` is **form-level configuration**, not derived form state — it
  is analogous to the existing `isEditMode` / `submitBlockedMessage` props on
  `ItemFormProps` (`src/features/inventory/components/ItemForm/types.ts`).
  Sections currently receive field data via a single `state: ItemFormState`
  object (built by `useItemFormState`) plus `inputStyling`, *not* individual
  field props. Add `locationLocked?: boolean` to `ItemFormProps`, then pass it
  from `ItemForm` directly to `OptionalSection` (a sibling prop alongside
  `state`/`inputStyling`), and from `OptionalSection` to `StorageField`. Default
  `false`.
- When locked, `StorageField`:
  - renders the `TextInput` with `editable={false}`,
  - explicitly guards the autocomplete suggestion menu so it never opens (with
    `editable={false}` the input won't focus or change, so the menu already
    won't open via `onFocus`/`onChangeText`, but keep an explicit guard so the
    `storageMenuVisible && existingStorageLocations.length > 0` block stays
    closed),
  - shows a `HelperText` with a new i18n key, e.g.
    `inventory:form.storageLockedMounted` →
    *"Location is set automatically while this part is mounted on a bike."*
- The create flow (`app/(tabs)/inventory/new.tsx`) is unaffected — a brand-new
  item cannot be mounted, so `locationLocked` defaults to `false`.

## App-layer touch-up

`useUpdateBike.onSuccess` (`src/features/bikes/hooks/useBikes.ts`) currently
invalidates only `['bikes', ...]` queries. Add invalidation of `['items']` (and
`['mounted-parts', id]`) so that a rename is reflected in mounted parts'
displayed locations without a manual refresh.

## Testing

- **DB / RLS integration** (`npm run test:rls`, primary — lives in
  `src/test/__tests__/rls/`):
  - Attaching a part sets its `storage_location` to the bike's name.
  - Detaching a part clears `storage_location` and sets status `stored`.
  - Renaming a bike updates `storage_location` on all its mounted parts.
  - Deleting a bike clears mounted parts' `storage_location` and resets status to
    `stored`.
- **Component test** (`OptionalSection` / `StorageField`): location field is
  disabled and the helper text is shown when `locationLocked` is true; editable
  with no helper otherwise.
- **Unit test** (`useUpdateBike`): a rename invalidates the `['items']` query.

When implementing the edit-form lock, confirm the locked location field does not
mark the edit screen dirty (the form receives the locked bike-name value as
`initialData.storageLocation`, so it should already match — this intersects with
the recent "do not mark edit screens dirty on photo changes" fix; verify, don't
assume).

## Documentation

- Update `docs/datamodel.md` to document the `storage_location` behavior for
  mounted items (derived from bike name, cleared on detach, synced on rename).

## Out of scope / YAGNI

- Restoring the pre-mount location on detach (explicitly decided against).
- Showing the location anywhere other than ItemDetail (no other surface renders
  it today).
- Any change to loaned/reserved status handling.
