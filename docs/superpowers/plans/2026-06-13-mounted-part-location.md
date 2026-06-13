# Mounted Part Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** While a bike part is mounted, its `storage_location` is the bike's name — set on attach, kept in sync on rename, cleared on detach — and the location field is read-only in the item edit form.

**Architecture:** A database trigger on `items` derives `storage_location` from the mounted bike (single source of truth, runs for every client/write path); a trigger on `bikes` re-syncs mounted parts on rename. The React Native edit form gets a `locationLocked` prop that disables the location field with an explanatory helper. `useUpdateBike` invalidates the items cache so renames show immediately.

**Tech Stack:** PostgreSQL (PL/pgSQL triggers via Supabase migrations), TypeScript, React Native, React Native Paper, react-i18next, TanStack Query, Jest, `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-06-11-mounted-part-location-design.md`

**Pre-flight (once, before Task 1):** This worktree needs deps and env before tests/DB run.

```bash
cd .worktrees/mounted-part-location
cp ../../.env.local .env.local   # (and ../../.env if present)
npm install
npm run db:start                 # local Supabase for RLS tests
```

If `db:start` reports a stuck container, follow the "Local Supabase troubleshooting" steps in CLAUDE.md.

---

## File Structure

- **Create** `supabase/migrations/00022_mounted_part_location.sql` — both trigger functions + triggers.
- **Create** `src/test/__tests__/rls/mounted-part-location.rls.test.ts` — DB integration tests for the triggers.
- **Modify** `src/features/bikes/hooks/useBikes.ts` — `useUpdateBike.onSuccess` invalidates `['items']` + `['mounted-parts', id]`.
- **Modify** `src/features/bikes/hooks/__tests__/useBikes.test.ts` — assert the new invalidations.
- **Modify** `src/features/inventory/components/ItemForm/types.ts` — add `locationLocked?: boolean` to `ItemFormProps`.
- **Modify** `src/features/inventory/components/ItemForm/ItemForm.tsx` — accept `locationLocked`, pass to `OptionalSection`.
- **Modify** `src/features/inventory/components/ItemForm/sections/OptionalSection.tsx` — accept `locationLocked`, pass to `StorageField`; render read-only + helper.
- **Modify** `src/features/inventory/components/ItemForm/sections/OptionalSection.test.tsx` — cover locked/unlocked.
- **Modify** `src/i18n/en/inventory.json` — add `form.storageLockedMounted`.
- **Modify** `app/(tabs)/inventory/edit/[id].tsx` — compute `locationLocked` and pass to `ItemForm`.
- **Modify** `docs/datamodel.md` — document the behavior.

---

## Task 1: Database triggers + RLS integration tests

**Files:**

- Create: `supabase/migrations/00022_mounted_part_location.sql`
- Test: `src/test/__tests__/rls/mounted-part-location.rls.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create `src/test/__tests__/rls/mounted-part-location.rls.test.ts`:

```typescript
import { adminClient, createTestUser, cleanupUsers, TestUser } from '../../rls/setup';

let user: TestUser;

beforeAll(async () => {
  user = await createTestUser('mount-loc');
});

afterAll(async () => {
  await cleanupUsers([user]);
});

async function seedBike(name: string): Promise<string> {
  const { data, error } = await user.client.from('bikes').insert({ name }).select('id').single();
  if (error) throw new Error(`seed bike: ${error.message}`);
  return data.id as string;
}

async function seedStoredItem(name: string): Promise<string> {
  const { data, error } = await user.client
    .from('items')
    .insert({
      owner_id: user.id,
      name,
      category: 'component',
      condition: 'good',
      visibility: 'private',
      status: 'stored',
      storage_location: 'Garage shelf',
    })
    .select('id')
    .single();
  if (error) throw new Error(`seed item: ${error.message}`);
  return data.id as string;
}

async function readItem(itemId: string) {
  const { data, error } = await user.client
    .from('items')
    .select('status, bike_id, storage_location')
    .eq('id', itemId)
    .single();
  if (error) throw new Error(`read item: ${error.message}`);
  return data;
}

describe('mounted part location trigger', () => {
  it('sets storage_location to the bike name when a part is mounted', async () => {
    const bikeId = await seedBike('Trek Domane');
    const itemId = await seedStoredItem('Shimano cassette');

    const { error } = await user.client
      .from('items')
      .update({ bike_id: bikeId, status: 'mounted' })
      .eq('id', itemId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.storage_location).toBe('Trek Domane');
  });

  it('clears storage_location and sets status stored when detached', async () => {
    const bikeId = await seedBike('Canyon Ultimate');
    const itemId = await seedStoredItem('Brake caliper');
    await user.client.from('items').update({ bike_id: bikeId, status: 'mounted' }).eq('id', itemId);

    const { error } = await user.client
      .from('items')
      .update({ bike_id: null, status: 'stored' })
      .eq('id', itemId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.storage_location).toBeNull();
    expect(item.status).toBe('stored');
  });

  it('syncs mounted parts when the bike is renamed', async () => {
    const bikeId = await seedBike('Old Name');
    const itemId = await seedStoredItem('Crankset');
    await user.client.from('items').update({ bike_id: bikeId, status: 'mounted' }).eq('id', itemId);

    const { error } = await user.client.from('bikes').update({ name: 'New Name' }).eq('id', bikeId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.storage_location).toBe('New Name');
  });

  it('clears location and resets status to stored when the bike is deleted', async () => {
    const bikeId = await seedBike('Doomed Bike');
    const itemId = await seedStoredItem('Saddle');
    await user.client.from('items').update({ bike_id: bikeId, status: 'mounted' }).eq('id', itemId);

    const { error } = await user.client.from('bikes').delete().eq('id', bikeId);
    expect(error).toBeNull();

    const item = await readItem(itemId);
    expect(item.bike_id).toBeNull();
    expect(item.storage_location).toBeNull();
    expect(item.status).toBe('stored');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:rls -- mounted-part-location`
Expected: FAIL — the "mounted" test sees `storage_location` still `'Garage shelf'` (no trigger yet), and the delete test sees `status` still `'mounted'`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/00022_mounted_part_location.sql`:

```sql
-- Mounted-part location rule (see docs/datamodel.md):
-- While an item is mounted on a bike, items.storage_location is the bike's name.
-- Set on attach, kept in sync on bike rename, cleared on detach / bike deletion.

CREATE OR REPLACE FUNCTION public.sync_item_storage_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'mounted' AND NEW.bike_id IS NOT NULL THEN
    -- attach, or any write while mounted: lock location to the bike name
    SELECT name INTO NEW.storage_location FROM bikes WHERE id = NEW.bike_id;
  ELSIF TG_OP = 'UPDATE'
        AND OLD.status = 'mounted' AND OLD.bike_id IS NOT NULL THEN
    -- was mounted, now isn't (detached, or bike deleted via ON DELETE SET NULL)
    NEW.storage_location := NULL;
    IF NEW.status = 'mounted' THEN
      NEW.status := 'stored';  -- orphaned mount: bike removed, status stale
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_item_storage_location() IS
  'Keeps items.storage_location equal to the mounted bike name; clears it on detach.';

REVOKE ALL ON FUNCTION public.sync_item_storage_location() FROM PUBLIC;

CREATE TRIGGER trg_items_sync_storage_location
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.sync_item_storage_location();

CREATE OR REPLACE FUNCTION public.sync_mounted_parts_on_bike_rename()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  UPDATE items
  SET storage_location = NEW.name
  WHERE bike_id = NEW.id AND status = 'mounted';
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_mounted_parts_on_bike_rename() IS
  'Re-syncs storage_location of mounted parts when a bike is renamed.';

REVOKE ALL ON FUNCTION public.sync_mounted_parts_on_bike_rename() FROM PUBLIC;

CREATE TRIGGER trg_bikes_sync_mounted_parts
AFTER UPDATE OF name ON public.bikes
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION public.sync_mounted_parts_on_bike_rename();
```

- [ ] **Step 4: Apply migrations**

Run: `npm run db:reset`
Expected: migrations apply with no error (`00022_mounted_part_location.sql` listed).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test:rls -- mounted-part-location`
Expected: PASS (all 4 tests).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/00022_mounted_part_location.sql \
        src/test/__tests__/rls/mounted-part-location.rls.test.ts
git commit -m "feat: derive mounted part location from bike via db triggers"
```

---

## Task 2: `useUpdateBike` invalidates the items cache

**Files:**

- Modify: `src/features/bikes/hooks/useBikes.ts:126-129` (`useUpdateBike.onSuccess`)
- Test: `src/features/bikes/hooks/__tests__/useBikes.test.ts` (in `describe('useUpdateBike')`)

- [ ] **Step 1: Write the failing test**

In `useBikes.test.ts`, inside `describe('useUpdateBike', ...)`, add a test that spies on `QueryClient.prototype.invalidateQueries` and asserts an `['items']` invalidation occurs after a successful update. Match the existing mock style in that file (it already mocks `mockUpdate/mockEq/mockSelect/mockSingle`). Example:

```typescript
it('invalidates the items cache so renamed mounted parts refresh', async () => {
  const bike = createMockBike({ name: 'Renamed' });
  mockUpdate.mockReturnValue({
    eq: mockEq.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({
          data: {
            id: bike.id,
            owner_id: bike.ownerId,
            name: 'Renamed',
            type: bike.type,
            created_at: bike.createdAt,
            updated_at: bike.updatedAt,
          },
          error: null,
        }),
      }),
    }),
  });

  const invalidateSpy = jest.spyOn(QueryClient.prototype, 'invalidateQueries');

  const { result } = renderHook(() => useUpdateBike(), {
    wrapper: createQueryClientHookWrapper(),
  });
  await result.current.mutateAsync({
    id: bike.id,
    name: 'Renamed',
    type: BikeType.Road,
    condition: ItemCondition.Good,
  });

  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] });
  invalidateSpy.mockRestore();
});
```

Add `QueryClient` to the `@tanstack/react-query` import in the test if not already imported.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- useBikes`
Expected: FAIL — `['items']` is never invalidated.

- [ ] **Step 3: Implement the change**

In `src/features/bikes/hooks/useBikes.ts`, extend `useUpdateBike`'s `onSuccess`:

```typescript
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bikes', user!.id] });
      queryClient.invalidateQueries({ queryKey: ['bikes', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['mounted-parts', variables.id] });
    },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:unit -- useBikes`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/bikes/hooks/useBikes.ts src/features/bikes/hooks/__tests__/useBikes.test.ts
git commit -m "feat: invalidate items cache on bike update for mounted-part location"
```

---

## Task 3: Edit-form location lock

**Files:**

- Modify: `src/i18n/en/inventory.json` (`form.storageLockedMounted`)
- Modify: `src/features/inventory/components/ItemForm/types.ts` (`ItemFormProps`)
- Modify: `src/features/inventory/components/ItemForm/ItemForm.tsx`
- Modify: `src/features/inventory/components/ItemForm/sections/OptionalSection.tsx`
- Modify: `app/(tabs)/inventory/edit/[id].tsx`
- Test: `src/features/inventory/components/ItemForm/sections/OptionalSection.test.tsx`

- [ ] **Step 1: Add the i18n string**

In `src/i18n/en/inventory.json`, add inside the `form` object (alongside `storageLabel`/`storagePlaceholder`):

```json
    "storageLockedMounted": "Location is set automatically while this part is mounted on a bike.",
```

- [ ] **Step 2: Write the failing component tests**

**Important about this test file:** the helper is `renderSection(overrides: OverrideProps = {})` (single arg, returns `{ handlers }`), it renders `<OptionalSection state={state} inputStyling={inputStyling} />`, and `react-i18next` is mocked with `t: (key) => key`. So assertions must target the **i18n key** (`'form.storageLockedMounted'`), NOT the English string. The storage input is queried via `screen.getByPlaceholderText('form.storagePlaceholder')`.

Changes to make:

- Add `locationLocked?: boolean` to the `OverrideProps` interface.
- Thread it through `renderSection` into the rendered element: `<OptionalSection state={state} inputStyling={inputStyling} locationLocked={overrides.locationLocked} />`.
- Add a test: when `locationLocked` is true and `showOptional` is true, the helper key `'form.storageLockedMounted'` is shown, and typing into the storage input does NOT call `setStorageLocation` (field is read-only).
- Add a test: when `locationLocked` is false/undefined, the helper key is absent and `setStorageLocation` fires on change (an editable-case test already exists at lines ~219+ — keep it; just assert the helper is absent in the default case).

```typescript
it('locks the storage field when locationLocked is true', () => {
  const { handlers } = renderSection({
    showOptional: true,
    storageLocation: 'Trek Domane',
    locationLocked: true,
  });
  expect(screen.getByText('form.storageLockedMounted')).toBeTruthy();

  const input = screen.getByPlaceholderText('form.storagePlaceholder');
  fireEvent.changeText(input, 'Manual edit');
  expect(handlers.setStorageLocation).not.toHaveBeenCalled();
});

it('does not show the locked helper when not mounted', () => {
  renderSection({ showOptional: true });
  expect(screen.queryByText('form.storageLockedMounted')).toBeNull();
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:unit -- OptionalSection`
Expected: FAIL — `OptionalSection` does not accept `locationLocked`; helper text not rendered.

- [ ] **Step 4: Thread the prop through types and ItemForm**

`types.ts` — add to `ItemFormProps`:

```typescript
  /** When true, the location field is read-only (e.g. part is mounted on a bike). */
  locationLocked?: boolean;
```

`ItemForm.tsx` — destructure `locationLocked = false` from props and pass it to `OptionalSection`:

```typescript
      <OptionalSection state={state} inputStyling={inputStyling} locationLocked={locationLocked} />
```

- [ ] **Step 5: Implement the lock in OptionalSection / StorageField**

In `OptionalSection.tsx`:

- Add `locationLocked` to `OptionalSectionProps` (`readonly locationLocked?: boolean;`) and to the function signature with default `false`.
- Pass `locationLocked` to `<StorageField ... />`.
- Add `locationLocked` to `StorageFieldProps`.
- In `StorageField`, when `locationLocked`:
  - set the `TextInput` `editable={false}`,
  - guard the suggestions block so it never opens (e.g. wrap the existing `storageMenuVisible && existingStorageLocations.length > 0` condition as `!locationLocked && storageMenuVisible && ...`),
  - in `onChangeText`/`onFocus`, early-return when `locationLocked` (defensive; `editable={false}` already blocks input),
  - render a `HelperText` (Paper, `type="info"`) with `t('form.storageLockedMounted')` below the input when `locationLocked` is true.

Keep all styles in the existing `StyleSheet` (`../styles`); no inline styles. Use `HelperText` already imported in this module.

- [ ] **Step 6: Wire the edit screen**

In `app/(tabs)/inventory/edit/[id].tsx`:

- Import `ItemStatus` from `@/shared/types` if not already imported.
- Where `<ItemForm ... />` is rendered, pass:

```tsx
locationLocked={item.status === ItemStatus.Mounted && item.bikeId !== undefined}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run test:unit -- OptionalSection`
Expected: PASS.

- [ ] **Step 8: Verify the locked field doesn't make the screen dirty**

The form receives the locked bike-name value as `initialData.storageLocation`, so the displayed value already matches initial data and `isDirty` stays false. Confirm by inspection (no code change expected). If a dirty-state issue surfaces, note it — it intersects with the recent "do not mark edit screens dirty on photo changes" fix; do not assume.

- [ ] **Step 9: Commit**

```bash
git add src/i18n/en/inventory.json \
        src/features/inventory/components/ItemForm/types.ts \
        src/features/inventory/components/ItemForm/ItemForm.tsx \
        src/features/inventory/components/ItemForm/sections/OptionalSection.tsx \
        src/features/inventory/components/ItemForm/sections/OptionalSection.test.tsx \
        "app/(tabs)/inventory/edit/[id].tsx"
git commit -m "feat: lock item location field while part is mounted"
```

---

## Task 4: Docs + full validation

**Files:**

- Modify: `docs/datamodel.md`

- [ ] **Step 1: Document the behavior**

In `docs/datamodel.md`, in the `items` section (near `storage_location` / `bike_id` / `status`), add a note:

> **Mounted-part location:** While `status = 'mounted'` and `bike_id` is set, `storage_location` is automatically the bike's `name` (DB triggers in `00022_mounted_part_location.sql`). It is set on attach, re-synced when the bike is renamed, and cleared (with `status` reset to `stored`) on detach or bike deletion. The location field is read-only in the item edit form while mounted.

- [ ] **Step 2: Run full validation**

Run: `npm run validate`
Expected: format:check + lint + type-check + unit tests all pass. (`validate` does NOT run a build, and there is no `validate:i18n` script despite CLAUDE.md mentioning one — the new key's correctness is covered by the OptionalSection tests + type-check.) RLS tests run separately — re-run `npm run test:rls -- mounted-part-location` to confirm green.

- [ ] **Step 3: Commit**

```bash
git add docs/datamodel.md
git commit -m "docs: document mounted-part location rule in datamodel"
```

---

## Done criteria

- `npm run test:rls -- mounted-part-location` — 4 passing trigger tests.
- `npm run test:unit -- useBikes OptionalSection` — passing.
- `npm run validate` — green.
- Mounting a part shows the bike name as its location in ItemDetail; the edit form's location field is read-only with the helper text; renaming the bike updates mounted parts; detaching/deleting the bike clears the location.
