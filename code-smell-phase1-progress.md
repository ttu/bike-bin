# Code Smell Phase 1 — Quick Wins Progress

## Tasks

- [x] 1. Replace `Alert.alert` with `ConfirmDialog` in `ListingDetailRoute.tsx`
- [x] 2. Replace hardcoded fallback strings (`'this member'`, `'Unknown'`) in `groups/[id].tsx` with `t()` keys
- [x] 3. Use `borderRadius` theme tokens wherever raw `12`, `28`, `9999` appear in StyleSheet objects
- [x] 4. Extract `getExchangeDialogProps` utility to replace 4 parallel ternary chains in `messages/[id].tsx`

# Code Smell Phase 2 — Targeted Refactoring Progress

## Tasks

- [x] 5. Promote `PhotoPicker` + `usePhotoPicker` to `src/shared/`
- [x] 6. Extract `usePhotoDirtyTracking` hook; apply to both edit screens
- [x] 7. Move `useDistanceUnit` to `src/shared/hooks/`
- [x] 8. Merge `fetchThumbnailPaths` / `fetchBikeThumbnailPaths` into a single parameterized function
- [x] 9. Extract `useReturnNavigation` hook to eliminate duplicated return-path logic

# Code Smell Phase 3 — Structural Refactoring Progress

## Tasks

- [x] 10. Decompose multi-mode screens (`groups/index.tsx`, `groups/[id].tsx`, `locations.tsx`) into separate components, removing `ScreenMode` state-based branching
- [x] 11. Extract `useItemActions` hook from `inventory/[id].tsx` to own confirm-then-mutate-then-snackbar orchestration
- [x] 12. Establish and enforce padding-bottom constant — add `shared/theme` export for list bottom padding, remove raw `80`/`100` magic numbers
