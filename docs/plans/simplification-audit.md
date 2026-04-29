# Bike Bin Simplification Audit

Generated 2026-04-28 from a feature-by-feature read of `src/shared/` and all 14 feature slices under `src/features/`. Roughly 155 high-confidence findings across reuse, quality, and efficiency. The full per-finding list begins under "Findings by area" below.

## Suggested fix order

The findings cluster around a few cross-cutting themes. Fixing the themes (rather than individual file:line items) deletes the most code and prevents regressions. Recommended order — earlier items unlock later ones:

1. **Centralize null→undefined and DB row mapping** _(blocks many other fixes)_. Add `shared/utils/nullToUndef.ts`; replace hand-rolled `as X` casts with generated Supabase row types in `mapItemRow`, `mapBikeRow`, `mapGroupRow`, `mapLocationRow`, `mapRatingRow`, and inline mappers in messaging/borrow/search. Removes hundreds of casts and silent `null` leaks.
2. **Fix `fetchPublicProfilesMap` N+1 RPC**. Add `get_public_profiles(p_user_ids uuid[])` RPC and replace the `Promise.all` of single calls. Wins for borrow lists, search results, ratings, messaging.
3. **Unify photo handling**. Lift `useStagedPhotos` (inventory) and `useStagedBikePhotos` (bikes) into `shared/useStagedEntityPhotos`. Same for `useItemPhotoManagement` / `useBikePhotoManagement` → `useRemoveEntityPhoto`. Make `PhotoPicker` accept a bucket prop. Collapse `CachedAvatarImage` + `CachedListThumbnail` into one `CachedImage`. Delete `usePhotoPicker.ts` (duplicate of `useImagePicker.ts`), `appendHexAlpha.ts` (duplicate of `colorWithAlpha.ts`), `fetchThumbnailPaths.ts` and `fetchBikeThumbnailPaths.ts` (3-line wrappers).
4. **Fix dead code and obvious duplicates**. Delete `groups/hooks/useCreateGroup.ts` (never imported). Collapse `exchange/useMarkDonated` + `useMarkSold` into `useMarkExchanged(kind)`. Remove duplicate query-key string literals in `demo/useDemoQuerySeeder.ts` in favor of centralized constants.
5. **Centralize cache invalidation**. Extract `invalidateItemAndConversationCaches(queryClient, itemId)` and `invalidateBorrowMutationCaches(queryClient)` helpers. Promote `'conversations'` / `'conversation'` / `'group-items'` to constants in `shared/api/queryKeys.ts`. Drop redundant per-id invalidations that prefix-match already covers.
6. **Replace stringly-typed status/role literals with enums** at boundaries: `useBorrowTransition`, accept/decline/mark-returned hooks, `useCreateConversation` (`'admin'` → `GroupRole.Admin`), `useItems` (`visibility ?? 'private'` → `Visibility.Private`).
7. **Decompose oversized form-state hooks**. Split `inventory/useItemFormState.ts` (29 useStates, 419L) into `useReducer`-based sub-hooks. Apply the same to `bikes/BikeForm` (extract `useBikeFormState`) and `search/FilterSheet` (likely the same pattern at 267L).
8. **Decompose oversized detail components**. `inventory/ItemDetail.tsx` (673L) and `search/ListingDetail.tsx` (645L) share photo/condition/brand/group sections — extract `<ItemSummaryView/>` to `shared/`, then split each detail into header/context/actions. Same idea: `SearchResultCard` + `SearchResultGridCard` → one `<ListingTeaser/>` with a layout prop.
9. **Fix i18n violations**. `OfflineBanner` hardcoded English; `formatRelativeTime` non-`t` overload; `MountedParts` action labels; `PhotoPicker` accessibility label; auth `t('key', 'English default')` inline defaults; thrown `Error('Not authenticated')` strings.
10. **Drop the recurring `useMemo(() => StyleSheet.create({...}), [theme])` no-op** in groups/locations/auth/bikes — `StyleSheet.create` is already memoized internally.
11. **Eliminate redundant wrappers**: `<>{children}</>`, `<>{fallback ?? null}</>`, single-line callback wrappers (`handleConfirm` → `onConfirm`, `setDistanceUnit` → `mutation.mutate`).
12. **Realtime cleanup**. Collapse two notification subscriptions into one. Patch the `messaging/useRealtimeMessages` cache via `setQueryData` instead of broad invalidation. Verify `PhotoGallery` Animated listener cleanup on web.

## Worktree plan

Each numbered theme above is a candidate worktree/PR. Suggested branch names:

- `refactor/null-to-undef-mapping` — theme 1
- `feat/get-public-profiles-rpc` — theme 2 (DB migration + client switch)
- `refactor/shared-photo-hooks` — theme 3
- `chore/dead-code-cleanup` — theme 4
- `refactor/cache-invalidation-helpers` — theme 5
- `refactor/enum-status-types` — theme 6
- `refactor/item-form-state-reducer` — theme 7
- `refactor/item-detail-decomposition` — theme 8
- `fix/i18n-hardcoded-strings` — theme 9
- `refactor/drop-stylesheet-memos` — theme 10
- `refactor/remove-fragment-wrappers` — theme 11
- `fix/realtime-subscriptions` — theme 12

Most are mechanical and safe to do in parallel **once theme 1 lands** (since the row-mapping changes touch many files).

## Top-level checklist

Tick items as the corresponding worktree merges. Sub-bullets are the principal sites.

- [ ] **1. Null→undefined + typed row mapping**
  - [ ] Add `shared/utils/nullToUndef.ts`
  - [ ] `shared/utils/mapItemRow.ts` — drop `as` casts
  - [ ] `shared/api/fetchPublicProfile.ts` — drop casts
  - [ ] `bikes/utils/mapBikeRow.ts` — drop casts, use enum membership
  - [ ] `groups/hooks/useGroups.ts:25-29` — drop double-casts
  - [ ] `groups/hooks/useGroupInvitations.ts` — null→undef helper
  - [ ] `locations/hooks/useUpdateLocation.ts` — typed Partial, use `mapLocationRow`
  - [ ] `locations/hooks/useCreateLocation.ts:47-56` — drop 8 casts, use mapper
  - [ ] `messaging/utils/fetchConversationsForUser.ts` — drop local types and double-casts
  - [ ] `borrow/hooks/useBorrowRequests.ts:53-94` — typed select shape
  - [ ] `borrow/hooks/useAcceptedBorrowRequestForItem.ts:14` — return undefined not null
  - [ ] `ratings/hooks/useUpdateRating.ts:27-38` — call `mapRatingRow`
  - [ ] `search/hooks/useSearchItems.ts:116-137` — generated RPC return type

- [ ] **2. `get_public_profiles(uuid[])` RPC**
  - [ ] DB migration adding RPC
  - [ ] `shared/api/fetchPublicProfile.ts:42-52` — single call
  - [ ] Verify borrow / search / messaging / ratings benefit (no client change needed)

- [ ] **3. Unify photo handling**
  - [ ] `shared/hooks/useStagedEntityPhotos.ts` — extract from inventory/bikes
  - [ ] `shared/hooks/useRemoveEntityPhoto.ts` — extract from inventory/bikes
  - [ ] `shared/components/CachedImage` — collapse `CachedAvatarImage` + `CachedListThumbnail`
  - [ ] `shared/components/PhotoPicker` — accept `bucket` prop
  - [ ] Delete `shared/hooks/usePhotoPicker.ts` (dup of `useImagePicker`)
  - [ ] Delete `shared/utils/appendHexAlpha.ts` (dup of `colorWithAlpha`)
  - [ ] Delete `shared/utils/fetchThumbnailPaths.ts` and `fetchBikeThumbnailPaths.ts`; call `fetchFirstPhotoPaths` directly
  - [ ] `shared/components/PhotoGallery/PhotoGallery.tsx` — use unified image + URL helper
  - [ ] `bikes/components/BikeCard/BikeCard.tsx:30-33` — use shared URL helper
  - [ ] Extract `shared/components/ConditionPicker` from `inventory/.../ConditionSection.tsx` and bikes inline
  - [ ] Generalize `useEntityRowCapacity` from inventory + bikes versions

- [ ] **4. Dead code and trivial duplicates**
  - [ ] Delete `groups/hooks/useCreateGroup.ts` (never imported)
  - [ ] Collapse `exchange/useMarkDonated` + `useMarkSold` → `useMarkExchanged(kind)`
  - [ ] Decide on `exchange/getExchangeDialogConfig` — wire into `useItemActions` or remove
  - [ ] `demo/useDemoQuerySeeder.ts:33-55` — import existing query-key constants
  - [ ] `demo/fixtures.ts:618,633,662,690` — fix invalid ISO concat bug

- [ ] **5. Centralize cache invalidation**
  - [ ] Add `shared/api/queryKeys.ts` constants for `CONVERSATIONS`, `CONVERSATION`, `GROUP_ITEMS`
  - [ ] Add `invalidateItemAndConversationCaches(queryClient, itemId)`
  - [ ] Add `invalidateBorrowMutationCaches(queryClient)`
  - [ ] Drop redundant per-id invalidations in `inventory/useItems.ts:198,221,240`
  - [ ] Drop redundant `['groups', id]` invalidation in `groups/useGroups.ts:106-107`
  - [ ] Drop redundant `['items', id]` in `exchange/useMarkDonated.ts:29` and `useMarkSold.ts:29`
  - [ ] Scope `notifications/useUnreadNotificationCount.ts:50` to `[KEY, user.id]`

- [ ] **6. Enum-typed boundaries**
  - [ ] `borrow/useBorrowTransition.ts:14-17` — `BorrowRequestStatus` / `ItemStatus`
  - [ ] borrow accept/decline/mark-returned hooks — enum literals
  - [ ] `messaging/useCreateConversation.ts:39` — `GroupRole.Admin`
  - [ ] `inventory/useItems.ts:117` — `Visibility.Private`

- [ ] **7. Form-state decomposition**
  - [ ] `inventory/ItemForm/useItemFormState.ts` (29 useStates) → `useReducer` + sub-hooks
  - [ ] `inventory/ItemForm/sections/OptionalSection.tsx` (39 props) → take `state`
  - [ ] `bikes/BikeForm/BikeForm.tsx` — extract `useBikeFormState`, decompose into sections
  - [ ] `bikes/BikeForm/BikeForm.tsx:155-197` — stop double-parsing
  - [ ] `bikes/BikeForm/BikeForm.tsx:117-120` — fix `nameFieldValue` shadowing bug
  - [ ] `search/FilterSheet/FilterSheet.tsx` (267L) — verify and refactor

- [ ] **8. Detail-component decomposition**
  - [ ] Extract `shared/components/ItemSummaryView` from `inventory/ItemDetail` + `search/ListingDetail`
  - [ ] Split `inventory/ItemDetail.tsx` (673L) → header/meta/actions
  - [ ] Split `search/ListingDetail.tsx` (645L) → header/context/actions/similar
  - [ ] Collapse `search/SearchResultCard` + `SearchResultGridCard` → `<ListingTeaser/>`
  - [ ] `search/useSearchItems.ts:139-165` — drop redundant snake_case re-mapping

- [ ] **9. i18n hardcoded strings**
  - [ ] `shared/components/OfflineBanner/OfflineBanner.tsx:29,34`
  - [ ] `shared/utils/formatRelativeTime.ts:30-39` — drop non-`t` overload
  - [ ] `shared/components/PhotoPicker/PhotoPicker.tsx:100`
  - [ ] `shared/utils/formatDistance.ts` — localize `' m'`/`' km'`
  - [ ] `auth/AuthGate.tsx:49,55,64,67` + `SyncBanner.tsx:21,27` — drop inline `t()` defaults
  - [ ] `bikes/MountedParts.tsx` action labels (and replace ad-hoc dialogs with `ConfirmDialog`)
  - [ ] `borrow/BorrowRequestCard.tsx:44-45` — translate `'?'` placeholder
  - [ ] `exchange/useMark*` — replace `throw new Error('Not authenticated')`
  - [ ] `inventory/useItems.ts:232` — typed delete error

- [ ] **10. Drop StyleSheet `useMemo` no-op**
  - [ ] `groups/components/GroupForm/GroupForm.tsx:51-66`
  - [ ] `locations/components/LocationForm/LocationForm.tsx:46-55`
  - [ ] `bikes/components/BikeForm/BikeForm.tsx:78-88`
  - [ ] `shared/components/CachedAvatarImage/CachedAvatarImage.tsx:18-28`

- [ ] **11. Remove redundant wrappers**
  - [ ] `auth/AuthGate.tsx:20,23` — drop fragments
  - [ ] `auth/provider.tsx:50-60` — drop `useCallback` wrappers
  - [ ] `auth/useAuth.ts:25-33` — drop no-op `useMemo`
  - [ ] `shared/components/ConfirmDialog/ConfirmDialog.tsx:46-48` — drop `handleConfirm`
  - [ ] `profile/useDistanceUnit.ts:33-38` — drop `useCallback` over `mutation.mutate`

- [ ] **12. Realtime + listeners**
  - [ ] Collapse `notifications/useRealtimeNotifications` + `useUnreadNotificationCount` channel into one provider-level subscription
  - [ ] `messaging/useRealtimeMessages.ts:52-71` — `setQueryData` patch instead of broad invalidate
  - [ ] `messaging/useRealtimeMessages.ts:11-17` — read `markRead` via ref
  - [ ] `shared/components/PhotoGallery/PhotoGallery.tsx:108` — Animated listener cleanup
  - [ ] `shared/hooks/useOfflineQueue.ts` — hydration guard, NetInfo trigger, `randomUuidV4`

- [ ] **Bonus / standalone fixes** (small, safe, can land in any PR)
  - [ ] `auth/useAuth.ts:6-22` — move demo overlay into demo provider (cross-feature import violation)
  - [ ] `auth/provider.tsx:11-48` — rely on `INITIAL_SESSION` event, drop `getSession` race
  - [ ] `bikes/MountedParts.tsx:23,31` — dedicated `useAvailableParts()` query
  - [ ] `bikes/MountedParts.tsx:55-57` — route helper in inventory public API
  - [ ] `borrow/useCreateBorrowRequest.ts` + `useCancelBorrowRequest.ts` — route through RPC for atomicity
  - [ ] `inventory/useItems.ts:87-201` — extract `itemFormDataToRow`
  - [ ] `inventory/useItems.ts:38-52` — parallelize items + thumbnails
  - [ ] `inventory/useItems.ts:17-30` — diff `syncItemGroups` instead of delete-and-insert
  - [ ] `messaging/useUnreadCount.ts:43-51` — single hook with selector
  - [ ] `messaging/fetchConversationsForUser.ts:179-213` — single RPC `list_conversations_for_user`
  - [ ] `notifications/useNotificationPreferences.ts:79-84` — return standard query/mutation shape
  - [ ] `search/useSearchItems.ts:64-66,75-94` — push offer-type/price filter into RPC
  - [ ] `search/useSearchItems.ts:68` — broaden gate beyond `query.length>0`
  - [ ] `ratings/useUpdateRating.ts:41` — also invalidate `['ratings','group',toGroupId]`
  - [ ] `demo/useDemoQuerySeeder.ts:24-31,60-67` — scoped `setQueryDefaults`, not global

---

## Findings by area

### src/shared/

#### Reuse

1. **`hooks/usePhotoPicker.ts` vs `useImagePicker.ts`** — Two hooks are byte-identical (same permission flow, picker options, compress, return shape) except for naming (`pickPhoto`/`PickedPhoto` vs `pickImage`/`PickedImage`). Delete `usePhotoPicker.ts` and migrate its callers to `useImagePicker`.
2. **`utils/colorWithAlpha.ts` vs `appendHexAlpha.ts`** — Two utilities for the same job; `appendHexAlpha` is only used in one stories file, `colorWithAlpha` is used everywhere. Delete `appendHexAlpha.ts` and switch the story to `colorWithAlpha`.
3. **`utils/fetchThumbnailPaths.ts` & `fetchBikeThumbnailPaths.ts`** — Both are 3-line wrappers around `fetchFirstPhotoPaths` that callers could invoke directly. Delete the two wrappers and call `fetchFirstPhotoPaths({ table, idColumn, ids })` at the few call sites.
4. **`components/CachedAvatarImage/CachedAvatarImage.tsx` vs `CachedListThumbnail.tsx`** — Both render `expo-image` with identical props (`source`, `cachePolicy="memory-disk"`, `recyclingKey`, `contentFit="cover"`); only differ in the style they pass through. Collapse into one `CachedImage` component; the avatar version is just `<CachedImage style={{width:size,height:size,borderRadius:size/2}}/>`.
5. **`components/PhotoGallery/PhotoGallery.tsx:53` & `PhotoPicker.tsx:24`** — Both inline `supabase.storage.from('item-photos').getPublicUrl(...)` and feed the result into `expo-image` props that exactly match `CachedListThumbnail`. Use `CachedListThumbnail`/the unified `CachedImage` plus a single `getItemPhotoPublicUrl(path)` helper.
6. **`PhotoPicker.tsx` is hardcoded to `'item-photos'` bucket** (line 24) but `useEntityPhotoUpload` already abstracts a `bucket` config — the picker only works for items, forcing bike features to maintain their own variant. Take `bucket` (or a resolved url) as a prop so it is reusable for bikes.

#### Quality

7. **`components/OfflineBanner/OfflineBanner.tsx:29` & `:34`** — Hardcoded English strings (`"You are offline…"`, `"Dismiss"`) violate the i18n rule. Move to `common.json` and call `t()`.
8. **`utils/formatRelativeTime.ts:30-39`** — The non-`t` overload returns hardcoded English (`"now"`, `"yesterday"`, `"just now"`, `"ago"`) and exists only as a fallback. Drop the overload and require a `t` translator at call sites.
9. **`utils/mapItemRow.ts:25-28`** — `(row.quantity as number | null) ?? Number.NaN` then `Number.isNaN(rawQty) ? 1 : Math.max(1, rawQty)` is convoluted; `quantity` is non-null in the schema. Simplify to `Math.max(1, (row.quantity as number) ?? 1)`.
10. **`utils/mapItemRow.ts:24-65` & `api/fetchPublicProfile.ts:12`** — Every column is hand-cast with `as` then `?? undefined`, defeating the generated `ItemRow`/database typing and re-introducing `unknown`-shaped reads. Use the typed Supabase row directly (no `as`) and a small helper `nullToUndef`.
11. **`hooks/usePhotoDirtyTracking.ts:16-25`** — Joining ids into a `'|'` string then splitting it back, with an `eslint-disable react-hooks/set-state-in-effect`, is a workaround for a missing baseline ref. Capture the baseline in a `useRef` set on first ready render — no string round-trip, no eslint-disable.
12. **`hooks/useOfflineQueue.ts:52-54`** — `AsyncStorage.setItem` runs on every queue change before the load effect has hydrated, so the persisted queue is overwritten with `[]` on first render before hydration completes. Track a "hydrated" flag and skip the persist effect until the load effect resolves.
13. **`hooks/useOfflineQueue.ts:90`** — `enqueue` IDs use `${Date.now()}-${Math.random()…}` despite `randomUuidV4` already living in shared. Use `randomUuidV4()`.
14. **`hooks/useConfirmDialog.ts:79-92`** — `confirmDialogProps` is rebuilt every render (no `useMemo`) and the inline `onDismiss`/`onConfirm` are new closures each render, which churns the `<ConfirmDialog/>` Dialog/Portal subtree. Memoize the prop object on `confirm`.
15. **`components/PhotoGallery/PhotoGallery.tsx:108`** — `useMemo(() => new Animated.Value(0), [])` should be `useRef(new Animated.Value(0)).current` (or `useAnimatedValue`); `useMemo` is not a guarantee in React. Same pattern in `AnimatedPressable.tsx:25`.
16. **`components/PhotoGallery/PhotoGallery.tsx:38-101`** — `ParallaxPhoto` takes seven props (incl. an internal `themed` style object and `useTranslation` hook called inside) — sprawl. Inline as a `.map` body or move `useTranslation` up so the child only takes `{photo, transform, onLongPress}`.
17. **`components/PhotoPicker/PhotoPicker.tsx:100`** — `accessibilityLabel="Add photo"` is a hardcoded string in a component that already has the `t()` available. Use `t('photos.addPhoto')` (or similar).
18. **`components/SnackbarAlerts/SnackbarAlertsProvider.tsx:9-22`** — `SnackbarState` carries five fields (`visible/message/variant/durationMs/action`) and the dismissal mutates only `visible`, so on the next show all stale fields linger until React rerenders. Split into `currentAlert: Alert | undefined` plus a separate `visible` boolean, or set state to `undefined` on dismiss.
19. **`components/ConfirmDialog/ConfirmDialog.tsx:46-48`** — `handleConfirm` is a one-line wrapper that just calls `onConfirm()`. Pass `onConfirm` directly.
20. **`components/ScreenMasthead/ScreenMasthead.tsx:81-103`** — Hardcoded `fontFamily: 'BigShoulders-Black'`, `fontWeight: '900'`, `letterSpacing: -1.2`, `lineHeight: 52`, `fontSize: 22` bypass the theme tokens (`displayLarge` already lives in `theme.fonts`). Use `theme.fonts.displayLarge` like `displaySmall` is used a few lines above.
21. **`components/Stamp/Stamp.tsx:32-37`** & **`DisplayFigure.tsx:67-82`** — Hardcoded `fontFamily: 'Manrope-Bold'`, `'BigShoulders-ExtraBold'`, `letterSpacing: 0.6`, `0.4`, `0.3`. Consolidate font tokens in `theme/theme.ts` and reference them.
22. **`components/EmptyState/EmptyState.tsx:30`** — `icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']` is stringly-typed. Type `icon` prop as that exact union in the interface so the cast disappears.
23. **`utils/formatDistance.ts`** — Hardcoded `' m'` / `' km'` strings shipped to UI; ignores `DistanceUnit` (`distanceConversion.ts` already has the unit machinery). Localize via `t('common.distance.m'|'km')` and integrate with `kmToDisplayUnit`.
24. **`utils/uploadPhoto.ts:60-63`** — `getPhotoCount` selects all `id`s and uses `data?.length`; for entities approaching the cap this transfers up to N rows when only a count is needed. Use `select('id', { count: 'exact', head: true })` and read `count`.
25. **`components/SnackbarAlerts/SnackbarAlertsProvider.tsx:67`** — Comment "Overrides Paper's wrapper padding…" narrates WHAT, not WHY beyond what the constant name already says; safe to drop.

#### Efficiency

26. **`api/fetchPublicProfile.ts:42-52`** — `fetchPublicProfilesMap` fans out one RPC per user id (`Promise.all` of single calls). Add a `get_public_profiles(p_user_ids uuid[])` RPC and issue a single round-trip.
27. **`components/CachedAvatarImage/CachedAvatarImage.tsx:18-28`** — `useMemo` calls `StyleSheet.create` on every size change, defeating its registry caching. Inline a plain object `{width, height, borderRadius}` (StyleSheet.create here gains nothing for a single dynamic style).
28. **`hooks/useOfflineQueue.ts:57-88`** — The replay effect depends on `[isOnline, queue]`, and every `setQueue` inside it re-fires the effect; the `isReplayingRef` guard helps but the effect still re-runs on every queue change while online (filter, allocate). Move the trigger to a NetInfo listener (or `isOnline` only) and read the latest queue from a ref.
29. **`utils/compressImageForMobileUpload.ts:42-58`** — Inner loop runs up to 4×9 = 36 image-manipulator passes, each doing a full decode/encode + size probe; the smallest size always wins from the smallest width, so iterating high widths first is wasted work for already-small inputs. Probe source dimensions/size first and skip widths ≥ source width.
30. **`components/PhotoGallery/PhotoGallery.tsx:108`** — `Animated.Value` survives unmount only via React lifecycle, but `Animated.event` listener attached via `Animated.ScrollView` is never explicitly removed; on web `scrollX` accumulates listeners across mounts. Use `Animated.event` cleanup or `useNativeDriver`-aware `useAnimatedScrollHandler` (Reanimated) and clear on unmount.

### src/features/auth/

#### Reuse

1. **`AuthGate.tsx:60 / SyncBanner.tsx:22`** — Login route `'/(auth)/login'` is duplicated as a string literal in two places. Extract a `LOGIN_ROUTE` constant (or a `goToLogin()` helper) inside the auth slice.
2. **`AuthGate.tsx:84-89`** — Hardcoded `marginTop: 16`, `marginBottom: 8`, `marginBottom: 24` in styles bypass the `spacing` tokens already imported from `@/shared/theme`. Replace with `spacing.sm` / `spacing.lg`.

#### Quality

3. **`AuthGate.tsx:23`** — `<>{fallback ?? null}</>` wraps an already-valid React node in a redundant fragment; just `return fallback ?? null`.
4. **`AuthGate.tsx:20`** — `<>{children}</>` fragment around a single ReactNode is unnecessary; return `children` directly.
5. **`AuthGate.tsx:26-74`** — `useAuthGate` mixes two responsibilities (imperative `requireAuth` callback and rendered `AuthModal` JSX) and forces every consumer to render the modal even when unused; split into a stateless `useRequireAuth()` plus a standalone `<AuthGateModal visible onDismiss .../>` component.
6. **`AuthGate.tsx:40-71`** — The `modal` JSX is recomputed on every render of every consumer because it isn't memoized and isn't a component; extracting to a component (per #5) avoids this.
7. **`AuthGate.tsx:49,55,64,67 + SyncBanner.tsx:21,27`** — `t('gate.title', 'Sign in to continue')` etc. embed English defaults inline as the second `t()` argument, which violates "no hardcoded user-facing strings" — the defaults belong only in the `en` JSON resource file.
8. **`useAuth.ts:6-14`** — `DEMO_USER` is cast through `as User` to satisfy the type, leaking the demo concern into the auth hook and coupling auth to the demo feature via direct `DemoModeContext` import (cross-feature internal import, against conventions). Move demo overlay into the demo provider (wrap `AuthContext.Provider` with demo values) so `useAuth` stays pure.
9. **`useAuth.ts:22`** — Importing `DemoModeContext` directly from `@/features/demo` bypasses the public `index.ts` API rule.
10. **`provider.tsx:11-48`** — The init-session effect uses an `isMounted` flag plus try/catch/finally for a single async call; cleaner pattern is a single `.then(...).catch(...).finally(...)` chain, or rely on `onAuthStateChange`'s `INITIAL_SESSION` (supabase-js v2) — making the explicit `getSession()` call redundant.
11. **`provider.tsx:50-60`** — Three near-identical one-line `useCallback` wrappers exist solely to satisfy the memoization deps; define the functions once at module scope or drop `useCallback`.
12. **`signInWithOAuthProvider.ts:9`** — `new URL(input, 'https://phony.example')` uses a sentinel base URL to parse a possibly-relative callback; the deep-link return is always absolute on native, so the base is dead defensive code.
13. **`signInWithOAuthProvider.ts:45`** — `authUrl === undefined || authUrl === ''` mixes two empty-checks; `!authUrl` is equivalent and clearer.

#### Efficiency

14. **`useAuth.ts:25-33`** — `useMemo` returns `context` directly when `!isDemoMode`, but lists `context` in deps so the memo never actually saves work; remove the `useMemo`.
15. **`provider.tsx:36`** — `void initializeSession()` runs in parallel with `onAuthStateChange` registration, so an auth event arriving between subscription and `getSession` resolution can be overwritten by the stale `getSession` result; gate or rely solely on `onAuthStateChange`'s `INITIAL_SESSION`.
16. **`AuthGate.tsx:40-71`** — `<Portal><Modal visible={showModal}>` keeps the Modal mounted (and its children rendered) even when `showModal` is false; wrap with `{showModal && (...)}`.

### src/features/bikes/

#### Reuse

1. **`hooks/useStagedBikePhotos.ts:1-116`** — Near-duplicate of `inventory/hooks/useStagedPhotos.ts:1-92`. Extract a shared `useStagedEntityPhotos({ pathPrefix, table, entityIdColumn, photoQueryKey, parentQueryKey })`.
2. **`hooks/useStagedBikePhotos.ts:12-18`** — Local `newStagedPhotoId` reimplements UUID logic from `shared/utils/randomUuid.ts:randomUuidV4`. Replace with `` `staged-${randomUuidV4()}` ``.
3. **`hooks/useBikeRowCapacity.ts:1-37`** — Structurally identical to `inventory/hooks/useInventoryRowCapacity.ts`. Generalize to a `useEntityRowCapacity({ data, dataLoading, dataError, limit, limitLoading })` helper.
4. **`components/BikeCard/BikeCard.tsx:30-33`** — Inlines `supabase.storage.from('item-photos').getPublicUrl(...)` while inventory factored this into `getItemThumbnailPublicUrl`; rename that helper or add a sibling and call it here.
5. **`components/BikeForm/BikeForm.tsx:289-337`** — The condition selector is line-for-line the same component as `inventory/.../sections/ConditionSection.tsx`. Extract `shared/components/ConditionPicker`.
6. **`components/BikeForm/BikeForm.tsx:1-436`** — Built monolithically while inventory already extracted `BrandModelSection`, `NameSection`, `OptionalSection`, `ActionsSection`, `useItemFormState`. Apply the same decomposition.
7. **`hooks/useBikePhotoManagement.ts`** vs `inventory/hooks/useItemPhotoManagement.ts` — identical pattern of "delete from storage then table, invalidate trio of keys"; lift into shared `useRemoveEntityPhoto`.

#### Quality

8. **`components/BikeForm/BikeForm.tsx:91-115`** — Nine separate `useState` hooks plus `errors` and a derived `draftData`; mirrors inventory's already-extracted `useItemFormState`. Extract `useBikeFormState`.
9. **`components/BikeForm/BikeForm.tsx:155-197`** — `handleSubmit` re-runs `optionalNumberFromInput` on the same strings that `buildBikeFormDataFromFields` already parsed (in `draftData`); validate by inspecting `draftData.distanceKm`/`usageHours` instead of parsing twice.
10. **`components/BikeForm/BikeForm.tsx:450`** — `sectionLabel: {}` is an empty StyleSheet entry referenced everywhere; delete the empty rule and the `[styles.label, styles.sectionLabel]` arrays.
11. **`components/BikeForm/BikeForm.tsx:117-120`** — `nameFieldValue` is computed but `onChangeText={setName}` writes the _real_ `name`, so when the user types into the displayed-resolved value the resolved value silently disappears. Either render `name` directly or split into `displayName` (read-only) and an explicit "Use auto" affordance.
12. **`utils/mapBikeRow.ts:11-21`** — `mapItemCondition` re-validates condition strings via a hard-coded literal union that already exists as the `ItemCondition` enum, and `mapOptionalNumber` is duplicated logic; use `Object.values(ItemCondition).includes(...)` and a shared `optionalFiniteNumber` helper.
13. **`utils/mapBikeRow.ts:24-41`** — Each field is cast `as <T>` from `BikeRow`, defeating the `BikeRow` type entirely; drop casts (or fix `rows.ts`).
14. **`hooks/useBikePhotoManagement.ts:25` / `useStagedBikePhotos.ts:100` / `useBikes.ts:91,123,143`** — All assert `user!.id` after `useAuth()` even though `enabled: !!user` is only on the queries; mutations have no such gate. Guard with an early `if (!user) throw …` once.
15. **`hooks/useDetachPart.ts:9`** — Destructures `bikeId` in the param type but never uses it inside `mutationFn`; either use it (e.g., to scope the update via `.eq('bike_id', bikeId)`) or remove from the type.
16. **`components/MountedParts/MountedParts.tsx:23,31`** — Loads the **entire** `useItems()` set just to filter to `Stored && !bikeId`. Add a dedicated `useAvailableParts()` query (`status=eq.Stored&bike_id=is.null`).
17. **`components/MountedParts/MountedParts.tsx:128-166`** — Two ad-hoc `Dialog`s reimplement what `shared/components/ConfirmDialog` already provides. Replace with `<ConfirmDialog destructive …>`.
18. **`components/MountedParts/MountedParts.tsx:55-57`** — Hardcoded route string `/(tabs)/inventory/${item.id}?fromBike=…` couples bikes to inventory's routing. Move to a small helper in inventory's public API.

#### Efficiency

19. **`hooks/useBikes.ts:23-28`** — On every refetch the query awaits `fetchBikeThumbnailPaths` for _all_ bikes serially after the rows arrive. Run the two queries in `Promise.all`.
20. **`components/BikeForm/BikeForm.tsx:78-88`** — `softInputStyles` is created inside a `useMemo` solely to read `theme`, but `underlineColor`/`activeUnderlineColor` next to it are recomputed on every render with no memo — inconsistent and the memo provides no value. Inline as a plain const.

### src/features/borrow/

#### Reuse

1. **`hooks/useCreateBorrowRequest.ts:46` and `useCancelBorrowRequest.ts:42`** — Each hook hardcodes `['items']` and `SEARCH_ITEMS_QUERY_KEY` invalidation, duplicating the invalidation block already centralized in `useBorrowTransition`. Extract a shared `invalidateBorrowMutationCaches(queryClient, extraKeys?)` helper (also covering `'group-items'`).
2. **`hooks/useCreateBorrowRequest.ts:34-39` / `useCancelBorrowRequest.ts:30-35`** — Both perform a two-step "update borrow_request + update items.status" round-trip from the client, while accept/decline/return go through the `transition_borrow_request` RPC; this duplicates state-machine logic the DB already encodes. Route create and cancel through (or add) RPCs so item status transitions are atomic and consistent.
3. **`hooks/useBorrowRequests.ts:66-95`** — Inline manual mapping of an items row duplicates conventions in `shared/utils/mapItemRow.ts`. Extract a `mapBorrowRequestRow` helper colocated with `mapItemRow`.
4. **`hooks/useBorrowRequests.ts:15` and `useAcceptedBorrowRequestForItem.ts:6`** — These borrow query keys live as feature-local constants while `SEARCH_ITEMS_QUERY_KEY` is centralized in `shared/api/queryKeys.ts` to avoid cross-feature circular imports. Move both keys into `shared/api/queryKeys.ts`.

#### Quality

5. **`hooks/useBorrowTransition.ts:14-17`** — `newRequestStatus`/`newItemStatus` are typed as plain `string`, allowing arbitrary values into the RPC. Type them as `BorrowRequestStatus` / `ItemStatus` enums.
6. **`hooks/useAcceptBorrowRequest.ts:5-7`, `useDeclineBorrowRequest.ts:5-7`, `useMarkReturned.ts:6-9`** — Stringly-typed status literals duplicated across three call sites. Replace with `BorrowRequestStatus.Accepted` / `ItemStatus.Loaned` etc.
7. **`hooks/useBorrowRequests.ts:53-94`** — Heavy use of `as string`, `as UserId`, `as ItemStatus` casts (the inline anonymous types on lines 56-58 and 67-73 are redundant once typed-Supabase types are used). Define a typed select shape so casts disappear.
8. **`hooks/useAcceptedBorrowRequestForItem.ts:14`** — Returns `Promise<BorrowRequestId | null>` and uses `null` returns; CLAUDE.md mandates `undefined` over `null`. Return `BorrowRequestId | undefined`.
9. **`components/BorrowRequestCard.tsx:188-206`** — `getStatusColor` switch has redundant cases: `Returned`, `Cancelled`, and `default` all return identical `surfaceVariant` colors. Collapse to two cases plus `default`, or build a `Record<BorrowRequestStatus, {bg,text}>` lookup.
10. **`components/BorrowRequestCard.tsx:36-39`** — Calls `getRequestActions(request, currentUserId, request.itemOwnerId, {...})` re-passing `request.itemOwnerId` as a separate arg and rebuilding an `item` object from fields already on `request`. Simplify `getRequestActions` to take just `(request, currentUserId)`.
11. **`components/BorrowRequestCard.tsx:44-45`** — `personName ?? '?'` hardcodes a placeholder string. Use a translated `common.unknownUser` key.
12. **`components/BorrowRequestCard.tsx:49-64`** — A switch over `RequestAction` plus four conditional `actions.includes(...)` JSX blocks (lines 142-181) double-iterates the action set and duplicates the action-to-handler mapping. Build an `actionConfig: Record<RequestAction, { handler, label, mode }>` and `.map()` over `actions`.
13. **`hooks/useBorrowRequests.ts:87-90`** — Silently coerces missing item fields to `'Unknown item'`, `'stored'`, empty string `UserId`, etc.; this masks data-integrity bugs and produces invalid branded IDs. Filter out rows with no joined item or surface an error.
14. **`hooks/useCreateBorrowRequest.ts:27`** — `message?.trim() || null` mixes empty-string falsy fallback and writes `null`. Use `const trimmed = message?.trim(); ... message: trimmed ? trimmed : undefined`.

#### Efficiency

15. **`shared/api/fetchPublicProfile.ts:43-49` (used by `useBorrowRequests.ts:64`)** — `fetchPublicProfilesMap` issues one `get_public_profile` RPC per unique user ID (N+1 fan-out); for a list of borrow requests this is the dominant cost. Add a `get_public_profiles` RPC accepting `uuid[]` and call it once.

### src/features/exchange/

#### Reuse

1. **`hooks/useMarkDonated.ts:11-36` and `hooks/useMarkSold.ts:11-36`** — Two hooks are byte-identical except for the `ItemStatus` literal (`Donated` vs `Sold`); collapse into a single `useMarkExchanged(kind: ExchangeKind)` parameterized hook (`ExchangeKind` already defined in `getExchangeDialogConfig.ts:3`).
2. **`hooks/useMarkDonated.ts:19-24` / `useMarkSold.ts:19-24`** — Both reimplement the `items.update({status}).eq(id)` PostgREST call already encapsulated by `useUpdateItemStatus` in `inventory/hooks/useItems.ts:204`. Compose that hook (or its mutationFn) and add the extra invalidations on top.
3. **`hooks/useMarkDonated.ts:27-33` / `useMarkSold.ts:27-33`** — The five-key invalidation list (`['items']`, `['items', id]`, `SEARCH_ITEMS_QUERY_KEY`, `['conversations']`, `['conversation']`) is duplicated verbatim and also repeated in `inventory/hooks/useTransferItem.ts:24`. Extract a shared `invalidateItemAndConversationCaches(queryClient, itemId)` helper.
4. **`utils/getExchangeDialogConfig.ts` vs `inventory/hooks/useItemActions.ts:47-81`** — `useItemActions` builds the donate/sell confirm config inline with the same `t('confirm.donate.*')` / `t('confirm.sell.*')` keys instead of calling the already-exported `getExchangeDialogConfig`; switch `useItemActions` to use it.

#### Quality

5. **`hooks/useMarkDonated.ts:13` / `useMarkSold.ts:13`** — `useAuth()` is called solely to throw `'Not authenticated'` if `user` is null, but RLS will reject the update server-side anyway; drop or replace with a session check via supabase client.
6. **`hooks/useMarkDonated.ts:17` / `useMarkSold.ts:17`** — `throw new Error('Not authenticated')` is a hardcoded English string surfaced to UI. Use a typed error or i18n key.
7. **`hooks/useMarkDonated.ts:31-32` / `useMarkSold.ts:31-32`** — Conversation query keys are stringly-typed (`'conversations'`, `'conversation'`) with no constant in `shared/api/queryKeys.ts`; promote to `CONVERSATIONS_QUERY_KEY` / `CONVERSATION_QUERY_KEY` constants alongside `SEARCH_ITEMS_QUERY_KEY`.
8. **`utils/getExchangeDialogConfig.ts:16-18`** — The `if (!kind)` branch returns an all-empty config that no caller appears to use (`getExchangeDialogConfig` has zero in-source consumers); either delete the util or remove the optional-`kind` overload and its dead empty-config branch.
9. **`utils/getExchangeDialogConfig.ts:8`** — `cancelLabel: string | undefined` is awkward when `tExchange()` always returns a string; simplify to `string`, or omit the field instead of a stringly-empty placeholder.
10. **`index.ts:3-4`** — `getExchangeDialogConfig` is exported but unused anywhere in the repo; either wire it into `useItemActions` (see #4) or remove from the public API.

#### Efficiency

11. **`hooks/useMarkDonated.ts:27-33` / `useMarkSold.ts:27-33`** — `invalidateQueries({ queryKey: ['items'] })` already invalidates the more specific `['items', itemId]` (TanStack matches by key prefix), so the second call on line 29 is redundant work.

### src/features/demo/

#### Reuse

1. **`fixtures.ts:56-79`** — `daysAgo`/`hoursAgo`/`minutesAgo` are local date helpers duplicated in spirit with the relative-time logic in `shared/utils/formatRelativeTime.ts`; though not perfectly equivalent, these are generic enough to live in `shared/utils/` (e.g. `relativeIso.ts`).
2. **`useDemoQuerySeeder.ts:33-55`** — Hardcoded query key strings (`'items'`, `'bikes'`, `'conversations'`, `'messages'`, `'borrowRequests'`, `'unread_message_count'`, `'unread_notification_count'`, `'profile'`, `['locations','primary',uid]`) duplicate string literals owned by other features and will silently break if those features rename their keys. Import the existing exports `CONVERSATIONS_QUERY_KEY`, `MESSAGES_QUERY_KEY`, `UNREAD_COUNT_QUERY_KEY`, `BORROW_REQUESTS_QUERY_KEY`, `NOTIFICATIONS_QUERY_KEY`, `UNREAD_NOTIFICATION_COUNT_QUERY_KEY`.
3. **`useDemoQuerySeeder.ts` (whole file)** — `DEMO_NOTIFICATIONS` and `DEMO_SEARCH_RESULTS` are defined in fixtures but never seeded into the cache, so notifications/search screens will be empty in demo mode. Add `setQueryData([NOTIFICATIONS_QUERY_KEY, uid], DEMO_NOTIFICATIONS)` and seed search results under the search hook's key.

#### Quality

4. **`fixtures.ts:618, 633, 662, 690`** — `createdAt: daysAgo(5) + '1'` string-concatenates `'1'` onto an ISO timestamp producing invalid `"...Z1"` strings that will fail `Date.parse` and break ordering. Use `new Date(Date.now() - days*86400_000 + 60_000).toISOString()` or a `withOffsetMinutes` helper.
5. **`fixtures.ts:705-708`** — `DEMO_MESSAGES` reverses arrays at module import via spread+reverse, but the source arrays are already chronological and the reversal duplicates ordering knowledge that belongs in `useMessages`. Store newest-first directly or document/enforce ordering with a single helper.
6. **`useDemoQuerySeeder.ts:15`** — `const uid = DEMO_USER_ID as string;` casts away the `UserId` brand and is reused in every key, defeating branded-id safety. Drop the cast — query keys accept branded strings directly.
7. **`useDemoQuerySeeder.ts:24-31, 60-67`** — Mutating `queryClient.setDefaultOptions` to `staleTime: Infinity` globally and resetting to a magic `5*60*1000` is a leaky abstraction that overrides app-wide config. Scope demo data with per-query `staleTime` via `queryClient.setQueryDefaults([...], { staleTime: Infinity })`.
8. **`provider.tsx:15-18`** — `exitDemoMode` calls `setIsDemoMode(false)` then `clearDemoData(queryClient)`; clearing the cache while components depending on demo data are still mounted causes a render with empty state before navigation. Clear after navigation completes.
9. **`DemoBanner.tsx:60`** — `fontSize: 12, fontWeight: '600'` are hardcoded in `buttonLabel`, violating the no-hardcoded-font-sizes rule. Use a Paper `labelSmall`/`labelMedium` variant or reference `theme.fonts.labelSmall`.
10. **`DemoBanner.tsx:8-11`** — JSDoc block comment restates obvious behavior already evident from the component name and code. Remove.
11. **`fixtures.ts:340-461`** — Each `SearchResultItem` repeats `groupId/groupName/groupRatingAvg/groupRatingCount/thumbnailStoragePath/...Url: undefined` boilerplate. Extract a `makeDemoSearchResult(partial)` factory.
12. **`fixtures.ts:604-700`** — Three near-identical `DEMO_MESSAGES_CONV_*` arrays repeat the `{conversationId, senderId, body, createdAt, isOwn}` shape with only data variation. Factor a `makeMsg(convId, senderId, body, createdAt)` helper.
13. **`data/ids.ts:42-52`** — Eleven sequentially numbered `DEMO_MESSAGE_N` exports are stringly-typed counter sprawl. Replace with a `makeDemoMessageId(n)` helper or a single `DEMO_MESSAGE_IDS` array.

#### Efficiency

14. **`useDemoQuerySeeder.ts:34-49`** — Two sequential `for` loops over `DEMO_ITEMS` and `DEMO_CONVERSATIONS` each call `setQueryData` per iteration; minor but every call triggers a notification.
15. **`provider.tsx:10-13`** — `enterDemoMode` seeds the cache then flips `isDemoMode`, but if the user re-enters demo mode after exit, prior `setQueryDefaults`/cache state from the new `clear()` cycle leaves no listener cleanup for any subscriptions started during the prior demo session. Ensure `clearDemoData` also `removeQueries`/cancels in-flight queries before flipping state.

### src/features/inventory/

#### Reuse

1. **`hooks/useItems.ts:87-201`** — `useCreateItem` and `useUpdateItem` repeat ~25 column-mapping lines (`name`, `category`, …, `quantity`); diff is mostly `?? null` for date fields. Extract `itemFormDataToRow(formData, { forUpdate })` and call from both.
2. **`hooks/useItems.ts:47`** — uses `fetchThumbnailPaths` which is the 3-line shared wrapper flagged in shared audit; once that's removed, call `fetchFirstPhotoPaths` directly.
3. **Photo handling** (`useStagedPhotos.ts`, `useItemPhotoManagement.ts`, `usePhotoUpload.ts`) duplicates `bikes/` equivalents — already flagged in bikes audit; lift to `shared/` as `useStagedEntityPhotos`/`useRemoveEntityPhoto`.
4. **`components/ItemForm/sections/ConditionSection.tsx`** is identical to bikes' inline condition picker — extract to `shared/components/ConditionPicker`.

#### Quality

5. **`components/ItemForm/useItemFormState.ts`** — 419 lines, ~29 `useState` calls. Sprawl. Group related fields into reducer state (`useReducer`) or sub-hooks (`useNameAndCategory`, `useAvailability`, `useOptionalDetails`, `useTags`).
6. **`components/ItemForm/sections/OptionalSection.tsx:12-50`** — 39 props on the props interface (all the form-state fields plus setters); a single `state: ItemFormState` prop would replace it.
7. **`hooks/useItems.ts:232`** — `throw new Error('Cannot delete item with status: ' + status)` is a hardcoded English message reaching error UI. Use a typed error class or i18n.
8. **`hooks/useItems.ts:117`** — `formData.visibility ?? 'private'` uses a stringly-typed default; `Visibility.Private` enum exists.
9. **`components/ItemDetail/ItemDetail.tsx`** — 673 lines mixing layout, action visibility, status display, and group info; split into `<ItemHeader/>`, `<ItemMeta/>`, `<ItemActions/>` for testability.
10. **`hooks/useItems.ts:198,221,240`** — `invalidateQueries({queryKey: ['items']})` is broad; the per-item invalidation (`['items', id]`) on the next line is redundant since prefix-match covers it.
11. **`hooks/useItems.ts:163-170`** — `?? null` writes for clearable fields are commented to explain `undefined vs null` PostgREST behavior; the same logic is forked across multiple fields — wrap in `clearable(value)` helper that returns `value ?? null`.

#### Efficiency

12. **`hooks/useItems.ts:38-52`** — `useItems` does sequential await: select all items → then fetchThumbnailPaths. Both can be parallelized: `Promise.all([listItems(), fetchThumbnailPaths()])` keyed off `user.id`.
13. **`hooks/useItems.ts:17-30`** — `syncItemGroups` always issues a DELETE then INSERT even when unchanged; on `useUpdateItem` paths where visibility never changed and `groupIds` is unchanged this is wasted DB roundtrip. Compare existing rows; only mutate diff.

### src/features/locations/

#### Reuse

1. **`hooks/useCreateLocation.ts:24-30` & `useUpdateLocation.ts:36-43`** — Both demote any existing primary with the same `update({is_primary:false}).eq('user_id', uid).eq('is_primary', true)` block. Extract `demoteCurrentPrimary(userId)` helper.
2. **`hooks/useCreateLocation.ts:47-56`** — Manual row→domain mapping inlined; `mapLocationRow` helper already exists in `utils/mapLocationRow.ts` and is used by `useLocations`. Use it.
3. **`hooks/useUpdateLocation.ts:55`** — `data as unknown as SavedLocation` skips the existing `mapLocationRow`. Use the helper for type safety.
4. **`components/LocationForm/LocationForm.tsx:46-55` (themeStyles useMemo)** — Same pattern flagged in groups/bikes/auth — `useMemo` over `StyleSheet.create` of one trivial entry adds no benefit. Inline as plain const.

#### Quality

5. **`hooks/useUpdateLocation.ts:20`** — `Record<string, unknown>` for the update payload reintroduces untyped writes. Use `Partial<SavedLocationRow>` or generated DB types.
6. **`hooks/useCreateLocation.ts:48-55`** — Eight `as` casts on each field shouldn't be needed if Supabase types flow through; remove and rely on typed row.
7. **`hooks/useLocations.ts:8`** — `locationsQueryKey(userId: string | undefined)` accepts plain string but query keys for users elsewhere use `UserId` brand. Tighten to `UserId | undefined`.
8. **`hooks/useUpdateLocation.ts:35-45`** — Three-level conditional flow: `if isPrimary !== undefined { if isPrimary { … } updates.is_primary = … }`. Flatten with early `if (input.isPrimary === true) await demoteCurrentPrimary(...)`.

#### Efficiency

9. **`hooks/useUpdateLocation.ts:38-42`** — `demoteCurrentPrimary` runs even when the row being updated _is_ already primary; the row will then get `update({is_primary: true})` setting it back to true. Skip demote if `input.id` is the current primary.
10. **`hooks/useCreateLocation.ts:21-30`** — Geocode runs before the primary-demote step; on geocode failure the demote never happens, but on demote failure the geocode work is wasted. Run them concurrently with `Promise.all`.

### src/features/messaging/

#### Reuse

1. **`utils/fetchConversationsForUser.ts:24-26` & `:131`** — `extractItem` handles `Items | Items[]` shape from Supabase nested select; the same pattern recurs in `groups/useGroups.ts:26` (`Array.isArray(row.groups) ? row.groups[0] : row.groups`). Extract `unwrapNestedJoin<T>(value: T | T[] | null)` to shared.
2. **`hooks/useCreateConversation.ts:34-42`** — `fetchGroupAdminIds` is messaging-local but the same query (group_members where role=admin) likely lives in groups; expose from `groups` public API.

#### Quality

3. **`utils/fetchConversationsForUser.ts:6-22`** — `ConvItem`, `ConvRow`, `LastMessage` are local types redefined with `string | null` shapes that the generated DB types should cover. Drop in favor of generated row types.
4. **`utils/fetchConversationsForUser.ts:131,70`** — `as unknown as ConvRow[]` / `as unknown as ExistingConv[]` double-cast defeats type safety. Use generated select-with-relations types.
5. **`hooks/useCreateConversation.ts:39`** — `eq('role', 'admin')` is stringly typed; `GroupRole.Admin` enum exists.
6. **`hooks/useUnreadCount.ts:43-51`** — `useUnreadCountByConversation` and `useUnreadCount` issue the same query but the latter has `select: sumCounts`. Consolidate by exposing `useUnreadCount(selector?)` or always return the map and let consumers `useMemo` the sum.
7. **`hooks/useRealtimeMessages.ts:11-17`** — `isFocusedRef` indirection plus the comment about "without re-subscribing" is correct, but `markRead` from `useMarkConversationRead` is also captured in deps. Make the effect depend only on `[conversationId, user]` and read `markRead` via ref like `isFocused`.

#### Efficiency

8. **`hooks/useRealtimeMessages.ts:52-71`** — Every realtime INSERT invalidates the broad `['conversations', userId]` cache; for active chats this floods refetches. Patch the cache via `setQueryData` (append the new row's lastMessageBody/at) instead of full invalidation.
9. **`utils/fetchConversationsForUser.ts:179-213`** — Loads conversations + 4 lookups for _every_ refetch even though messages are mostly append-only; a single RPC `list_conversations_for_user(uid)` returning the joined shape avoids 5 round-trips.

### src/features/notifications/

#### Reuse

1. **`hooks/useRealtimeNotifications.ts:13-43` & `useUnreadNotificationCount.ts:35-59`** — Two effects subscribe to the _same_ `INSERT on notifications WHERE user_id=eq.X` filter on different channel names (`notifications:UID` vs `unread-notifications`). Combining into one provider-level subscription would halve the realtime channel count per user.
2. Both invalidate `[UNREAD_NOTIFICATION_COUNT_QUERY_KEY]` on insert; whichever fires first triggers a refetch the other duplicates. Same as #1 — collapse subscriptions.

#### Quality

3. **`hooks/useNotificationPreferences.ts:15-38`** — Hand-rolled JSON validator with two `as Record<string, unknown>` casts; this exact pattern recurs across the app and could be a tiny `coerceBoolean(value, default)` helper or a `zod` schema.
4. **`hooks/useNotificationPreferences.ts:79-84`** — Returns a custom shape `{preferences, isLoading, updatePreferences, isUpdating}` instead of the standard query/mutation shape; consumers can't use `query.error` or `mutation.error`. Return the standard shapes.

#### Efficiency

5. **`hooks/useUnreadNotificationCount.ts:50`** — Realtime invalidation uses broad `[UNREAD_NOTIFICATION_COUNT_QUERY_KEY]` (no user id), so any other user's cache entry would also refetch in tests/multi-user dev. Scope to `[UNREAD_NOTIFICATION_COUNT_QUERY_KEY, user.id]`.

### src/features/onboarding/

#### Quality

1. **`hooks/useOnboardingStatus.ts`** (50 lines) and **`components/ProgressDots.tsx`** (42 lines) — feature is intentionally tiny, no high-confidence findings beyond shared-style nits; skipping.

### src/features/profile/

#### Reuse

1. **`hooks/usePublicProfile.ts` & `hooks/useProfile.ts`** — Two separate hooks fetching profile rows; one calls `fetchPublicProfile`, the other queries directly. Consider `useProfile(id)` taking own-or-other id, with own-id including private fields.
2. **`hooks/usePublicListings.ts`** — `useSearchItems` exists in `search/`; cross-feature import via public API would dedupe row→domain mapping.

#### Quality

3. **`hooks/useDeleteAccount.ts`, `useRequestExport.ts`, `useSubmitSupport.ts`** — Three near-identical mutation wrappers calling Edge Functions; consider a generic `useEdgeFunctionMutation(name)` helper, or accept the duplication as small.
4. **`hooks/useDistanceUnit.ts:15`** — `user?.id as UserId | undefined` cast; `user.id` should already carry the brand from the auth type. Drop the cast.
5. **`hooks/useDistanceUnit.ts:33-38`** — `useCallback` wrapper around `mutation.mutate` adds no value (`mutate` is reference-stable from React Query). Return `mutation.mutate` directly.

### src/features/ratings/

#### Quality

1. **`hooks/useUpdateRating.ts:27-38`** — Manually re-implements `mapRatingRow` inline with 9 `as` casts instead of calling the existing helper used by `useCreateRating.ts:34`. Replace with `mapRatingRow(data)`.
2. **`hooks/useCreateRating.ts:22-23`** — `?? null` writes for `to_user_id` / `to_group_id` mix `null` writes (PostgREST clear) with the project's `undefined` preference; either accept here as DB-write boundary or pass `undefined`.
3. **`hooks/useUpdateRating.ts:41`** — `invalidateQueries({queryKey:['ratings', variables.toUserId]})` ignores the `toGroupId` case that `useCreateRating` covers; group ratings won't refresh after edit.

### src/features/search/

#### Reuse

1. **`components/SearchResultCard/SearchResultCard.tsx` (187L) vs `SearchResultGridCard/SearchResultGridCard.tsx` (166L)** — Two cards rendering the same listing in different layouts; almost certainly duplicate photo/availability/price chunks. Extract shared `<ListingTeaser/>` primitive (or render the same component with a `layout` prop).
2. **`components/ListingDetail/ListingDetail.tsx` (645L) vs `inventory/ItemDetail.tsx` (673L)** — Both render an item; photo gallery, condition, brand/model, group badge are likely duplicated. Lift shared `<ItemSummaryView/>` primitive.
3. **`hooks/useSearchItems.ts:139-165`** — `OwnerProfile` shape is converted from `fetchPublicProfilesMap`'s already-mapped result back to snake_case (`display_name`, `avatar_url`, `rating_avg`) just to be re-read in `mapRow`. Drop the conversion — use the public-profile shape directly.
4. **`hooks/useSearchItems.ts:4`** — uses `fetchThumbnailPaths`, the 3-line shared wrapper flagged for removal in shared audit.

#### Quality

5. **`hooks/useSearchItems.ts:116-137`** — Local `RpcRow` interface duplicates DB column names; the search RPC's return shape can be expressed via generated types.
6. **`hooks/useSearchItems.ts:64-66` & `:75-94`** — Client-side filtering for `offerTypes`, `priceMin`, `priceMax` after the RPC means the result count after pagination is wrong (filters trim the page). Push filters into the RPC for correctness, not just perf.
7. **`hooks/useSearchItems.ts:69`** — `staleTime: 60_000 // 1 minute` comment is WHAT-not-WHY. Drop.
8. **`hooks/useSearchItems.ts:217-219`** — `groupName: undefined, groupRatingAvg: 0, groupRatingCount: 0` are always undefined/0 because the RPC doesn't fetch group data; if needed for group-owned items, fetch in the same `Promise.all`.
9. **`components/ListingDetail/ListingDetail.tsx`** — 645 lines. Split into header / context / actions / similar.
10. **`components/FilterSheet/FilterSheet.tsx` (267L)** — Likely has the same `useState` sprawl pattern as `useItemFormState`. Convert to `useReducer`.

#### Efficiency

11. **`hooks/useSearchItems.ts:68`** — Query disabled when `filters.query.length === 0` — but the RPC supports browse-without-query; gate on at least one filter (query OR category OR location) instead of forcing query text.

### src/features/groups/

#### Reuse

1. **`hooks/useCreateGroup.ts:1-44` is dead code.** Two `useCreateGroup` exist — the standalone file is never imported (the public API at `index.ts:16` re-exports from `useGroups.ts`). Delete the standalone file; the version in `useGroups.ts:38` is the live one and handles the private-group RLS workaround.
2. **`hooks/useGroupInvitations.ts:88-99` and `:47-58`** — both inline `(row.x as unknown as ...)` profile mapping; extract a small `mapInviteeProfile(row)` helper.

#### Quality

3. **`hooks/useGroups.ts:25-29`** — `row.role as string as GroupMember['role']` double-cast and `row.joined_at as string` defeat the typed Supabase row.
4. **`hooks/useGroups.ts:44`** — uses `crypto.randomUUID()` directly while shared/utils provides `randomUuidV4`. Use the shared helper for consistency.
5. **`hooks/useGroupInvitations.ts:18,21,89-97`** — manual `null → undefined` coercion repeated row-by-row; once shared `nullToUndef` helper exists, use it.
6. **`hooks/useGroupInvitations.ts:130`** — `useCancelInvitation` declares `groupId` in the param type but never uses it inside `mutationFn` (used only for invalidation). Document or destructure to make intent clear.
7. **`components/GroupForm/GroupForm.tsx:51-66`** — `useMemo` for `themeStyles` rebuilds on every theme color change but is just a tiny object literal; drop the memo. Same pattern flagged in bikes/auth/locations.

#### Efficiency

8. **`hooks/useGroupInvitations.ts:160-163`** — `useAcceptInvitation` invalidates `['my-group-invitations']` and `['group-invitations']` (broad keys) plus `['group-members', groupId]`; the broad invalidations refetch every variant unnecessarily. Scope to specific keys.
9. **`hooks/useGroups.ts` `useUpdateGroup:106-107`** — `invalidateQueries({queryKey:['groups']})` already prefix-matches `['groups', id]`, so the second call is redundant.
   </content>
   </invoke>
