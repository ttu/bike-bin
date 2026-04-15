# Code Quality Summary — Bike Bin

## Critical Issues

**3 high-severity issues found — address in next sprint**

### Top 3 Problems

1. **Multi-Mode Screens** — 3 screens (`groups/index`, `groups/[id]`, `locations`) pack 2–3 conceptually separate screens into one component using a state-variable switch. Each is 300–518 lines and growing. — **Priority: High**

2. **Duplicated Photo-Edit Logic** — the photo-dirty-tracking algorithm and hero thumbnail section are copy-pasted verbatim between the item edit screen and the bike edit screen. Any bug fix must be applied twice. — **Priority: High**

3. **Business Logic in Screen Components** — `inventory/[id].tsx` has 6 inline confirm-then-mutate-then-snackbar handlers (195 lines of handler code); `messages/[id].tsx` has exchange dialog configuration spread across 4 separate ternary chains. Both belong in hooks/utils. — **Priority: High**

---

## Overall Assessment

- **Project Size**: ~183 TypeScript files, 2 languages (TypeScript + SQL migrations)
- **Code Quality Grade**: B (well-structured overall; recurring but fixable duplication patterns)
- **Total Issues**: High: 3 | Medium: 13 | Low: 12
- **Overall Complexity**: Medium

---

## Business Impact

- **Technical Debt**: Medium
- **Maintenance Risk**: Medium — multi-mode screens are the primary risk; adding a new mode to any of these files cascades across 300–500 lines
- **Development Velocity Impact**: Low-Medium — most smells are isolated; the cross-feature import issue affects IDE navigation and refactoring safety
- **Recommended Priority**: High (architectural issues) / Medium (duplications) / Low (style)

---

## Quick Wins

- **Replace `Alert.alert` with `ConfirmDialog`** in `ListingDetailRoute.tsx`: Priority: High — 1-line JSDoc says to prefer ConfirmDialog; fixes the UX inconsistency immediately
- **Hardcoded fallback display names** in `groups/[id].tsx` (`'this member'`, `'Unknown'`): Priority: Medium — violates project i18n rule; add two translation keys
- **Raw `borderRadius` numbers** (`12`, `28`, `9999`) across 10+ files: Priority: Low — replace with theme tokens in one pass; no logic change
- **Merge `fetchThumbnailPaths` + `fetchBikeThumbnailPaths`**: Priority: Low — two files differ by one string each; easy to merge

---

## Major Refactoring Needed

- **Multi-mode screens** (`groups/index`, `groups/[id]`, `locations`): Priority: High — decompose into Expo Router routes or separate named components; eliminates the ScreenMode state anti-pattern and reduces file sizes by ~40%
- **`PhotoPicker` promoted to shared**: Priority: High — the bikes domain imports `PhotoPicker` directly from inside the inventory feature's internal directories, violating the feature-slice boundary rule; move to `shared/components/`
- **`useDistanceUnit` moved to shared**: Priority: Medium — `inventory/ItemDetail` imports from the `profile` feature; peer-feature coupling complicates testing and future reorganization
- **Extract `usePhotoDirtyTracking` hook**: Priority: Medium — eliminates the copy-paste between the two edit screens

---

## Recommended Action Plan

### Phase 1 (Immediate — 1–2 days)

- Replace `Alert.alert` with `ConfirmDialog` in `ListingDetailRoute` (1 file)
- Fix hardcoded i18n fallback strings in `groups/[id].tsx` (2 keys to add)
- Add `borderRadius` and list-padding constants to theme; do a sweep to replace raw numbers

### Phase 2 (Short-term — 3–5 days)

- Promote `PhotoPicker` + `usePhotoPicker` to `shared/`
- Extract `usePhotoDirtyTracking` hook; apply to both edit screens
- Move `useDistanceUnit` to `shared/`; update `inventory` and profile screens
- Extract `getExchangeDialogProps` utility to clean up `messages/[id].tsx`
- Merge the two `fetchThumbnailPaths` functions

### Phase 3 (Long-term — 1 sprint)

- Decompose the three multi-mode screens into proper routes or sub-components
- Extract `useItemActions` hook from `inventory/[id].tsx`
- Add ESLint rule banning deep cross-feature internal imports
- Add ESLint rule banning `supabase.storage` calls outside of `shared/` or feature utility files

---

## Key Takeaways

- The codebase follows feature-slice conventions well; most issues are within features, not between them
- The `ScreenMode` state pattern (multi-mode screens) is the single highest-impact smell: it bloats file size, makes hooks run in unused modes, and makes each file harder to navigate
- The cross-feature import of `PhotoPicker` from `inventory` into `bikes` is the most significant architectural boundary violation; it can be resolved in one session
- Duplicated mutation-handling boilerplate (confirm + mutate + snackbar) appears across at least 5 screens; a shared `useConfirmMutation` abstraction would reduce ~200 lines of near-identical code

---

_Detailed technical analysis with file:line references available in `code-smell-detector-report.md`_
