# Code Smell Detection Report — Bike Bin

> **Historical snapshot.** This report was produced **before** the
> `refactor/code-smell-phase1` effort. Many of the findings below have since
> been addressed in that refactor (container/presentational split for the
> multi-mode screens, extraction of `useItemActions`, FAB layout helpers,
> inline-style memoization, branded IDs for photo fetching, etc.). Treat this
> document as the pre-PR baseline, not a TODO list.

## Executive Summary

Analysis of `/Users/ttu/src/github/bike-bin` covering the `src/` and `app/` directories of an Expo + React Native + TypeScript project. The codebase is generally well-structured, follows feature-slice conventions, and avoids many common pitfalls. However, several recurring patterns across medium-to-large screen files represent meaningful maintainability risk. No critical architectural violations were found.

**Total Issues Found: 28**

- High Severity: 3
- Medium Severity: 13
- Low Severity: 12

---

## Project Analysis

**Language:** TypeScript (strict mode)
**Framework:** Expo / React Native with Expo Router
**UI Library:** React Native Paper (MD3)
**State management:** TanStack Query (server), React Context (client)
**Architecture:** Feature slices under `src/features/`, screens under `app/(tabs)/`

Files analyzed: 62 app screens + ~120 feature/shared source files.

---

## High Severity Issues (Architectural Impact)

### 1. Divergent Change / Long Method — Multi-Mode Screen Pattern (3 screens)

**Files:**

- `app/(tabs)/profile/groups/index.tsx` (456 lines)
- `app/(tabs)/profile/groups/[id].tsx` (518 lines)
- `app/(tabs)/profile/locations.tsx` (302 lines)

**Smell:** Divergent Change (Change Preventer) + Long Method

All three screens use a `ScreenMode` state variable (`'list' | 'create' | 'search'`, `'detail' | 'edit'`, `'list' | 'add' | 'edit'`) to conditionally return entirely different UIs from a single component function. Each mode is a full screen — its own appbar, form/list layout, and scroll view — making the component a container for three conceptually separate screens.

```typescript
// groups/index.tsx
type ScreenMode = 'list' | 'create' | 'search';
export default function GroupsScreen() {
  const [mode, setMode] = useState<ScreenMode>('list');
  // ...
  if (mode === 'create') { return <...full create screen JSX...>; }
  if (mode === 'search') { return <...full search screen JSX...>; }
  return <...full list screen JSX...>;
}
```

**Why it matters:** Each mode branch adds ~80–150 lines. When a new mode is needed, the component grows further. Hooks from all modes are always instantiated (e.g. `useSearchGroups` and `useCreateGroup` run even when the user is in list mode). All form state (`name`, `description`, `isPublic`, `nameError`) lives in the parent component even when the create mode is not active. This violates the Single Responsibility Principle: the component changes for list concerns, create concerns, edit concerns, and search concerns independently.

**Principle violated:** SRP (SOLID-S), High Cohesion (GRASP)

**Refactoring:** Extract each mode branch into its own named component or Expo Router screen. The mode state becomes standard navigation. Form state and create/search hooks belong exclusively in their respective screens. This is the most impactful refactoring in the codebase.

---

### 2. Duplicated Code — Photo Management Baseline Pattern (2 screens)

**Files:**

- `app/(tabs)/inventory/edit/[id].tsx` (lines 41–64)
- `app/(tabs)/bikes/edit/[id].tsx` (lines 40–63)

**Smell:** Duplicated Code (Dispensable)

The photo-dirty-tracking logic is copy-pasted verbatim across both edit screens:

```typescript
// Identical in both files
const photoIdsKey = useMemo(() => photos.map((p) => p.id).join('|'), [photos]);

useEffect(() => {
  if (!itemReady || !photosReady) return;
  const ids = photoIdsKey.length > 0 ? photoIdsKey.split('|') : [];
  setPhotoBaseline(ids);
}, [itemReady, photosReady, photoIdsKey]);

const photosDirty = useMemo(() => {
  if (photoBaseline === undefined) return false;
  if (photos.length !== photoBaseline.length) return true;
  return photos.some((p, i) => p.id !== photoBaseline[i]);
}, [photos, photoBaseline]);
```

The hero section (thumbnail image + entity name) is also structurally identical in both files, differing only in bucket name (`'item-photos'` vs `'item-photos'` — both use the same bucket) and icon:

```typescript
// edit/[id].tsx (inventory) — line 184–190
const thumbnailUri =
  photos.length > 0
    ? supabase.storage.from('item-photos').getPublicUrl(photos[0].storagePath).data.publicUrl
    : ...

// edit/[id].tsx (bikes) — line 181–184
const thumbnailUri =
  photos.length > 0
    ? supabase.storage.from('item-photos').getPublicUrl(photos[0].storagePath).data.publicUrl
    : undefined;
```

**Why it matters:** Any bug fix or change to the dirty-detection algorithm must be applied in two places. The `supabase.storage` URL construction also leaks infrastructure knowledge into a screen component.

**Principle violated:** DRY

**Refactoring:** Extract a `usePhotoDirtyTracking(photos, isEntityReady, isPhotosReady)` hook to `src/shared/hooks/`. Extract a `useItemThumbnailUrl(photos, fallbackStoragePath?)` utility or use an existing shared utility. Both `HERO_SIZE = 160` and the hero section JSX are candidates for a shared `EditHeroImage` component.

---

### 3. Business Logic in Screen Component — Exchange Confirm Handlers

**Files:**

- `app/(tabs)/inventory/[id].tsx` (lines 68–263)
- `app/(tabs)/messages/[id].tsx` (lines 195–296)

**Smell:** Feature Envy (Coupler) + Business Logic in Component

The item detail screen (`inventory/[id].tsx`) contains five separate `handle*` functions, each of which assembles `openConfirm` options, calls a mutation, then calls `showSnackbarAlert` on both success and failure. This entire orchestration pattern — confirm dialog → mutate → snackbar — repeats verbatim for `markDonated`, `markSold`, `archive`, `unarchive`, `delete`, and `markReturned`. The `handleMarkReturned` function even contains a branching strategy (use `acceptedBorrowRequestId` if available, otherwise fall back to `updateStatus`), which is business logic that belongs in a hook.

In `messages/[id].tsx`, the `handleConfirmExchange` function (lines 222–267) branches on `exchangeConfirm.kind` and calls either `markDonated.mutate` or `markSold.mutate` with near-identical success/error callbacks. The exchange dialog labels (`exchangeDialogTitle`, `exchangeDialogMessage`, `exchangeCancelLabel`, `exchangeConfirmLabel`) are computed via four parallel ternary chains (lines 269–295) that could be a single lookup table.

**Why it matters:** Screen components should coordinate navigation and user interaction; mutation orchestration and business rules belong in hooks or utils. The current structure makes the logic harder to test (it is bound to component state) and harder to reuse.

**Principle violated:** SRP (SOLID-S), Information Expert (GRASP), business logic in component (project rule)

**Refactoring:** Extract `useItemActions(item, ...)` hook that encapsulates confirm-then-mutate-then-snackbar. Extract exchange dialog config to a `getExchangeDialogConfig(kind, tExchange)` utility in `features/exchange/utils/`.

---

## Medium Severity Issues (Design Problems)

### 4. Duplicated Code — Confirm-Mutate-Snackbar Pattern (BorrowRequestsScreen)

**File:** `app/(tabs)/profile/borrow-requests.tsx` (lines 80–216)

Four handlers (`handleAccept`, `handleDecline`, `handleCancel`, `handleMarkReturned`) each contain ~30 lines of identical structure: call `openConfirm`, pass an `onConfirm` callback that calls `mutation.mutate(...)` with `onSuccess` closing the dialog and showing a success snackbar, and `onError` closing and showing the generic error snackbar. The only variation is the mutation called and the feedback key.

**Smell:** Duplicated Code (Dispensable)

**Refactoring:** Extract a `useBorrowAction(mutation, confirmOptions, feedbackKey)` helper or consolidate into a single `handleAction(config)` function.

---

### 5. Magic Numbers — Hardcoded Padding and Border Radius Values

**Files (selected):**

- `app/(tabs)/profile/index.tsx` line 303: `paddingBottom: 100`
- `app/(tabs)/search/index.tsx` line 396: `paddingBottom: 100`
- `app/(tabs)/messages/index.tsx` line 92: `paddingBottom: 100`
- `app/(tabs)/bikes/index.tsx` line 102: `paddingBottom: 80`
- `app/(tabs)/profile/groups/index.tsx` line 396: `paddingBottom: 80`
- Multiple files: `borderRadius: 12`, `borderRadius: 28`, `borderRadius: 9999`

**Smell:** Magic Number (Lexical Abuser)

The `80` and `100` values represent a tab bar offset used across at least five files. The project has `fabOffsetAboveTabBar` and `fabListScrollPaddingBottom` in `shared/theme/` but these are not used consistently. `borderRadius: 12`, `borderRadius: 28`, and `borderRadius: 9999` appear as raw literals in multiple files even though `borderRadius.md`, `borderRadius.lg`, and `borderRadius.full` presumably exist in `shared/theme/`.

**Why it matters:** When the tab bar height changes (e.g. for a new platform or notch variant), every hardcoded site must be updated.

**Refactoring:** Use `fabListScrollPaddingBottom(insets.bottom)` consistently. Add `borderRadius.searchbar` or use `borderRadius.full` for pill shapes. Define a theme constant for the raw `28` searchbar radius.

---

### 6. Cross-Feature Internal Import — `bikes` imports from `inventory/components`

**Files:**

- `app/(tabs)/bikes/new.tsx` line 19: `from '@/features/inventory/components/PhotoPicker/PhotoPicker'`
- `app/(tabs)/bikes/new.tsx` line 20: `from '@/features/inventory/hooks/usePhotoPicker'`
- `app/(tabs)/bikes/edit/[id].tsx` line 19: `from '@/features/inventory/components/PhotoPicker/PhotoPicker'`
- `src/features/bikes/hooks/useStagedBikePhotos.ts` line 8: `import type { PickerPhoto } from '@/features/inventory/components/PhotoPicker/PhotoPicker'`

**Smell:** Insider Trading (Coupler) — direct internal-path import bypassing the feature's public `index.ts`

The `bikes` feature and the `app/(tabs)/bikes` screens import `PhotoPicker` and `usePhotoPicker` directly from inside the `inventory` feature's `components/` and `hooks/` directories. The `inventory` feature's `index.ts` does not re-export these, meaning the bikes domain is coupling to an internal implementation detail of inventory.

**Why it matters:** If `inventory` renames or reorganizes `PhotoPicker`, the bikes feature breaks silently. This also violates the project's own architectural rule: "Features import from shared/ and own slice only."

**Refactoring:** Either move `PhotoPicker` and `usePhotoPicker` to `src/shared/components/` and `src/shared/hooks/` (they have no inventory-specific logic), or explicitly re-export them from `src/features/inventory/index.ts`.

---

### 7. Cross-Feature Import — `inventory` imports from `profile`

**Files:**

- `src/features/inventory/components/ItemDetail/ItemDetail.tsx` line 12: `from '@/features/profile'`
- `src/features/inventory/components/ItemForm/useItemFormState.ts` line 16: `from '@/features/profile'`

**Smell:** Inappropriate cross-feature dependency

The `inventory` feature directly imports `useDistanceUnit` from the `profile` feature. This creates a coupling between two peer-level features that both depend on `auth`. Distance unit is a user preference — it could be considered shared infrastructure rather than a profile-feature concern.

**Why it matters:** The inventory feature cannot be understood or tested in isolation without the profile feature being present and configured.

**Refactoring:** Move `useDistanceUnit` to `src/shared/hooks/useDistanceUnit.ts`, or expose it via a shared context. The same concern applies to `useItemFormState.ts`.

---

### 8. Duplicated Code — `fetchThumbnailPaths` / `fetchBikeThumbnailPaths`

**Files:**

- `src/shared/utils/fetchThumbnailPaths.ts`
- `src/shared/utils/fetchBikeThumbnailPaths.ts`

**Smell:** Duplicated Code (Dispensable)

Both functions are structurally identical — same algorithm, same return type, same guard. The only difference is the table name (`item_photos` / `bike_photos`) and the ID column name (`item_id` / `bike_id`):

```typescript
// fetchThumbnailPaths: table = 'item_photos', idCol = 'item_id'
// fetchBikeThumbnailPaths: table = 'bike_photos', idCol = 'bike_id'
```

**Refactoring:** Extract a generic `fetchFirstPhotoPaths(table, idCol, ids)` function and have both named functions delegate to it, or remove the named wrappers entirely.

---

### 9. Primitive Obsession — `userId` Cast Pattern

**Files:** ~10 screen files

```typescript
// Repeated in borrow-requests.tsx, profile/index.tsx, groups/[id].tsx, edit-profile.tsx, export-data.tsx
const userId = (user?.id ?? '') as UserId;
```

The fallback `'' as UserId` creates a branded empty string that will pass TypeScript's type checker but will produce incorrect behaviour (e.g. an empty string passed to a query used as a filter). Additionally, `userId as string as UserId` (two casts chained) appears in `profile/[userId].tsx` and `profile/support.tsx` — a sign that the type relationship is unclear.

**Smell:** Primitive Obsession — using a raw cast instead of a guard

**Refactoring:** Guard the consumer with `if (!user) return null` or use `userId: user?.id as UserId | undefined` and handle `undefined` in hooks.

---

### 10. Side Effect in Component — `setTimeout` for Modal Sequencing

**File:** `app/(tabs)/messages/[id].tsx` lines 201–215

```typescript
const handleMarkDonated = useCallback(() => {
  setMenuVisible(false);
  // Defer confirm until after the Paper Menu modal finishes dismissing.
  setTimeout(() => {
    setExchangeConfirm({ kind: 'donate', itemId });
  }, 0);
}, [conversation]);
```

**Smell:** Temporal Coupling / Hidden Dependencies (Functional Abuser)

The `setTimeout(..., 0)` is used to sequence two modal dismiss/open operations. While the comment explains the intent, this approach is fragile: it relies on the event loop ordering and the animation duration of the Paper `Menu` component. If the menu dismissal becomes async in a future RNP update, the `ConfirmDialog` may open before the `Menu` finishes animating.

**Refactoring:** Use `onDismiss` callback of the `Menu` component to open the confirm dialog, or use a state machine approach where `exchangeConfirm` is only set after `menuVisible` transitions to `false` via a `useEffect`.

---

### 11. Inconsistent Confirmation UX — `Alert.alert` vs `ConfirmDialog`

**Files:**

- `src/features/search/components/ListingDetailRoute/ListingDetailRoute.tsx` lines 100–119
- All other confirmation dialogs use `ConfirmDialog` from `@/shared/components`

**Smell:** Oddball Solution (Other)

The borrow request confirmation in `ListingDetailRoute` uses the native `Alert.alert` API, while every other confirmation in the codebase uses the custom `ConfirmDialog` component. The `ConfirmDialog` JSDoc even says: "Prefer this over `Alert.alert` / `window.confirm` so UI matches app chrome."

**Refactoring:** Replace `Alert.alert` in `ListingDetailRoute` with `useConfirmDialog` + `ConfirmDialog`, consistent with the rest of the codebase.

---

### 12. Multi-Namespace Translation in One Component

**Files:**

- `app/(tabs)/profile/index.tsx` (5 namespaces: `profile`, `borrow`, `groups`, `notifications`, `auth`, `demo`)
- `app/(tabs)/messages/[id].tsx` (4 namespaces: `messages`, `exchange`, `profile`, `common`)
- `app/(tabs)/inventory/[id].tsx` (4 namespaces: `exchange`, `inventory`, `borrow`, `common`)

**Smell:** Feature Envy (Coupler) — a component that reaches into many feature namespaces for translation keys signals too many responsibilities

When a single component requires translation keys from `borrow`, `groups`, `notifications`, `auth`, and `demo`, it is either coordinating too much or the keys belong in a shared namespace.

**Refactoring:** Move cross-cutting feedback and error strings to `common.json`. Extract the borrow-badge logic from `ProfileScreen` into a `usePendingBorrowCount` hook that lives in the `borrow` feature and returns a formatted label.

---

### 13. Hardcoded Fallback Strings Not Going Through i18n

**File:** `app/(tabs)/profile/groups/[id].tsx`

```typescript
const displayName = member.profile.displayName ?? 'this member'; // lines 191, 219
member.profile.displayName ?? 'Unknown'; // line 430
```

**Smell:** Uncommunicative Name / Hardcoded String — violates the project rule "No hardcoded strings — all user-facing text via t()"

Three different fallback strings are used for a missing display name: `'this member'` (twice), `'Unknown'` (once), and `'—'` (in `profile/[userId].tsx` line 144). None go through `t()`.

**Refactoring:** Add a `t('detail.unknownMember')` key and use it consistently. Consolidate to a single `fallbackDisplayName` utility if needed across features.

---

### 14. Lazy Element — `GroupCard` and `SearchResultCard` Private to File

**File:** `app/(tabs)/profile/groups/index.tsx` (lines 280–389)

`GroupCard` and `SearchResultCard` are defined inside the screen file and cannot be used elsewhere. They contain non-trivial rendering logic (icon selection, chip display, member count). If a `GroupCard` is ever needed on a groups listing page embedded elsewhere, it would need to be re-extracted.

**Smell:** Speculative concern is low, but the components are substantial enough to belong in `src/features/groups/components/`.

**Note:** This is borderline and only worth extracting if groups cards are needed elsewhere. Mark as low priority.

---

### 15. `PhotoPicker` Used from `inventory` Across `bikes` and `app/(tabs)/bikes/new.tsx`

Already covered in item 6, but there is an additional instance: `app/(tabs)/inventory/new.tsx` also imports `PhotoPicker` by internal path. The component is used in four places across two feature domains, which confirms it should be promoted to `shared/`.

---

### 16. `supabase.storage` Direct Access in Screen Components

**Files:**

- `app/(tabs)/inventory/edit/[id].tsx` lines 186–190
- `app/(tabs)/bikes/edit/[id].tsx` lines 183–184

```typescript
supabase.storage.from('item-photos').getPublicUrl(photos[0].storagePath).data.publicUrl;
```

**Smell:** Hidden Dependencies / Indecent Exposure — screen components directly call the storage client

The edit screen accesses Supabase storage directly to build a thumbnail URL, rather than delegating to a utility or hook. This leaks infrastructure knowledge into the presentation layer and makes the component harder to test.

**Refactoring:** Extract `getItemPhotoUrl(storagePath: string): string` to `src/features/inventory/utils/` and `getBikePhotoUrl(storagePath: string): string` to `src/features/bikes/utils/`, or a single `getStoragePhotoUrl(bucket, storagePath)` in `src/shared/utils/`.

---

## Low Severity Issues (Readability / Maintenance)

### 17. What Comment — Inline Comments Describing Obvious JSX

**Files:** Multiple screens

```typescript
{
  /* Header */
}
{
  /* Tab bar */
}
{
  /* Content */
}
{
  /* Actions */
}
{
  /* Group info */
}
{
  /* Members */
}
```

These comments appear in `groups/index.tsx`, `groups/[id].tsx`, `borrow-requests.tsx`, `messages/[id].tsx`. They restate the structure of the code rather than explaining _why_ something is done.

**Smell:** What Comment (Other)

**Refactoring:** Remove comments that mirror the code structure. Reserve comments for non-obvious decisions (e.g. the `FlatList inverted scaleY` comment in `messages/[id].tsx` is appropriate because the intent is non-obvious).

---

### 18. Inconsistent Snackbar `duration` Usage

**Observation:** Some error snackbars pass `duration: 'long'` while others do not, with no clear policy. Successful actions never use `duration: 'long'`. This is consistent within files but never documented as a rule.

**Smell:** Inconsistent Style (Other) — low concern

---

### 19. `ScreenMode` Type Defined Locally in Three Screen Files

Three files independently define their own `type ScreenMode` with different variants. There is no shared type for this navigation-within-a-screen pattern, but since each is different and local, this is a low concern.

---

### 20. `handleBack` Decoded Return Path Logic Repeated

**Files:**

- `app/(tabs)/profile/[userId].tsx` lines 36–43
- `src/features/search/components/ListingDetailRoute/ListingDetailRoute.tsx` lines 90–97

```typescript
const handleBack = useCallback(() => {
  const decoded = decodeReturnPathParam(returnPath);
  if (decoded && isSafeTabReturnPath(decoded)) {
    router.replace(decoded as Href);
    return;
  }
  tabScopedBack(fallbackHref);
}, [returnPath, router]);
```

These are nearly identical. A `useReturnNavigation(returnPath, fallbackHref)` hook would eliminate the duplication.

**Smell:** Duplicated Code (Dispensable) — low severity because it is only two callsites

---

### 21. `listContentContainerStyle` Computed Inline with `useMemo` (Overuse of `useMemo`)

**Files:** `app/(tabs)/inventory/index.tsx` lines 266–272, `app/(tabs)/search/index.tsx` lines 268–275

Both screens wrap a simple array literal in `useMemo`. For style objects that are based on insets and item counts, `useMemo` is appropriate when the dependency is expensive, but `useMemo` on a two-element array construction is micro-optimisation that adds cognitive overhead without measurable performance benefit.

**Smell:** Speculative Generality (Dispensable) — very low severity

---

### 22. `ProfileScreen` has `handleSignOut` and `handleConfirmSignOut` not wrapped in `useCallback`

**File:** `app/(tabs)/profile/index.tsx` lines 44–57

The two handlers are defined as plain `function` expressions rather than `useCallback`. Given the screen has multiple re-render triggers, this is a minor inconsistency with the rest of the codebase that uses `useCallback` for all handlers.

**Smell:** Inconsistent Style — very low severity

---

### 23. Dead Code Risk — `from '@/features/auth/components/SyncBanner/SyncBanner'` bypasses index.ts

**File:** `app/(tabs)/inventory/index.tsx` line 18

`SyncBanner` is imported by its full internal path rather than through `@/features/auth`. The `auth` feature's `index.ts` may or may not export it. This is a pattern inconsistency, not a bug, but it couples the screen to the component's file location.

---

### 24. Inline JSX Callbacks (minor)

**Files:** Several screens contain JSX inline callbacks:

```typescript
onPress={() => tabScopedBack('/(tabs)/messages')}
onPress={() => setMenuVisible(false)}
onPress={() => setReportVisible(false)}
```

These create new function instances on every render. For `Pressable` and `Appbar.BackAction`, the performance impact is negligible, but it is inconsistent with the `useCallback` usage elsewhere.

**Smell:** Inconsistent Style — very low severity

---

### 25. `listingCard` styles use raw `borderRadius: 12` instead of theme token

**File:** `app/(tabs)/profile/[userId].tsx` line 297

```typescript
listingCard: {
  borderRadius: 12,
```

The `borderRadius.md` token from `@/shared/theme` should be used here.

---

### 26. `const HERO_SIZE = 160` duplicated in two edit screens

**Files:**

- `app/(tabs)/inventory/edit/[id].tsx` line 293
- `app/(tabs)/bikes/edit/[id].tsx` line 267

Both declare the same `HERO_SIZE = 160` constant. Should be a shared constant or moved to the (proposed) shared `EditHeroImage` component.

---

### 27. `App/(tabs)/messages/[id].tsx` — Nested conditional for exchange dialog props

**File:** `app/(tabs)/messages/[id].tsx` lines 269–295

Four separate ternary chains each check `exchangeConfirm?.kind`:

```typescript
const exchangeDialogTitle = exchangeConfirm?.kind === 'donate' ? ... : exchangeConfirm?.kind === 'sell' ? ... : '';
const exchangeDialogMessage = ...
const exchangeCancelLabel = ...
const exchangeConfirmLabel = ...
```

This is a Data Clump — the four dialog configuration values belong together in a single object returned by a `getExchangeDialogProps(kind, tExchange)` utility.

**Smell:** Data Clump (Bloater)

---

### 28. `groups/[id].tsx` — Unreachable `displayName` variable

**File:** `app/(tabs)/profile/groups/[id].tsx` lines 191, 219

```typescript
const displayName = member.profile.displayName ?? 'this member';
```

`displayName` is computed but only used in the confirm dialog message string. The variable is not referenced elsewhere in the function. If `displayName` were `undefined`, the template string would still work correctly. This is a minor dead-intermediate-variable smell.

---

## Impact Assessment

| Severity | Count | Examples                                                                                       |
| -------- | ----- | ---------------------------------------------------------------------------------------------- |
| High     | 3     | Multi-mode screens, photo-dirty duplication, exchange action logic in components               |
| Medium   | 13    | Magic numbers, cross-feature imports, duplicated confirm pattern, inconsistent confirmation UX |
| Low      | 12    | What comments, inline callbacks, raw borderRadius values, HERO_SIZE duplication                |

**SOLID Violations:**

- SRP: 3 (multi-mode screens, inventory/[id].tsx handler proliferation, ProfileScreen namespace overload)
- DIP: 2 (supabase.storage in screens, PhotoPicker bypassing feature index)

**GRASP Violations:**

- High Cohesion: 3 (multi-mode screens)
- Information Expert: 2 (business logic in screen components, handleMarkReturned branching)
- Low Coupling: 2 (cross-feature internal imports)

**Other Principle Violations:**

- DRY: 4 (fetchThumbnail duplication, photo-dirty pattern, HERO_SIZE, handleBack pattern)
- Project rules: 3 (hardcoded strings, supabase.storage in components, cross-feature internal import)

---

## Recommendations and Refactoring Roadmap

### Phase 1 — Quick Wins (Low Risk)

1. **Replace `Alert.alert` with `ConfirmDialog`** in `ListingDetailRoute.tsx` — one-file change, consistent with documented preference.
2. **Replace hardcoded fallback strings** (`'this member'`, `'Unknown'`) in `groups/[id].tsx` with `t()` keys.
3. **Use `borderRadius` theme tokens** wherever raw `12`, `28`, `9999` appear in StyleSheet objects.
4. **Extract `getExchangeDialogProps`** utility in `features/exchange/utils/` to replace the four parallel ternary chains in `messages/[id].tsx`.

### Phase 2 — Targeted Refactoring

5. **Extract `usePhotoDirtyTracking` hook** to `src/shared/hooks/` and use in both edit screens.
6. **Extract `getStoragePhotoUrl(bucket, storagePath)`** utility to eliminate `supabase.storage` calls in screens.
7. **Promote `PhotoPicker` and `usePhotoPicker`** to `src/shared/components/` and `src/shared/hooks/` or re-export from `inventory/index.ts`.
8. **Move `useDistanceUnit`** to `src/shared/hooks/` or `src/shared/context/` to break the `inventory` → `profile` coupling.
9. **Merge `fetchThumbnailPaths` / `fetchBikeThumbnailPaths`** into a single parameterized function.
10. **Extract `useReturnNavigation`** hook to eliminate the two copies of the decoded-return-path navigation logic.

### Phase 3 — Structural Refactoring

11. **Decompose multi-mode screens** (`groups/index.tsx`, `groups/[id].tsx`, `locations.tsx`) into separate Expo Router routes or at minimum separate named components, removing the `ScreenMode` state-based branching.
12. **Extract `useItemActions`** hook from `inventory/[id].tsx` to own the confirm-then-mutate-then-snackbar orchestration.
13. **Establish and enforce the padding-bottom constant** — add a `shared/theme` export for list bottom padding and remove all raw `80` / `100` magic numbers from StyleSheet objects.

### Prevention Strategies

- Add an ESLint rule (e.g. `no-restricted-imports`) that prevents deep feature-internal imports — any import from `@/features/X/components/`, `@/features/X/hooks/`, or `@/features/X/utils/` within a _different_ feature or within `app/` should require a lint comment override.
- Add a lint rule banning `supabase.storage` calls outside of `src/shared/` or designated utility files.
- Document the "ScreenMode" anti-pattern in `docs/code-quality.md` and prefer Expo Router navigation instead.
- Consider adding a shared `useConfirmMutation` hook that abstracts the confirm-open → mutate → close → snackbar flow.

---

## Appendix — Files Analyzed

**app/(tabs) screens (21):** inventory/index.tsx, inventory/[id].tsx, inventory/edit/[id].tsx, inventory/new.tsx, inventory/notifications.tsx, bikes/index.tsx, bikes/[id].tsx, bikes/edit/[id].tsx, bikes/new.tsx, search/index.tsx, search/[id].tsx, messages/index.tsx, messages/[id].tsx, messages/item/[itemId].tsx, profile/index.tsx, profile/[userId].tsx, profile/edit-profile.tsx, profile/borrow-requests.tsx, profile/groups/index.tsx, profile/groups/[id].tsx, profile/locations.tsx

**src/features (selected key files):** inventory/components/ItemDetail/ItemDetail.tsx, search/components/ListingDetailRoute/ListingDetailRoute.tsx, auth/hooks/useAuth.ts, bikes/hooks/useStagedBikePhotos.ts, inventory/components/ItemForm/sections/VisibilitySection.tsx, inventory/components/ItemForm/useItemFormState.ts

**src/shared (selected):** utils/fetchThumbnailPaths.ts, utils/fetchBikeThumbnailPaths.ts, all theme files

**Detection methodology:** Static analysis via Read, Grep, and Glob tools. No automated tooling. Line counts via wc -l. Cross-feature import analysis via grep on `from '@/features/'` patterns.
