# Follow-up tasks

Deferred work spun out of in-flight PRs. Each item is small enough to land in its own PR.

## From theme 7 (form-state decomposition)

- [x] **`search/FilterSheet` reducer refactor** — **verified, pattern does not apply.** `FilterSheet.tsx` is pure presentation (receives `filters` + `onFiltersChange` as props); the actual state lives in `useSearchFilters` and is a single `useState<SearchFilters>` over a flat 9-field object plus a `useState<boolean>` for `hasSearched`. The reducer pattern in #96/#97 was motivated by 20+ scattered `useState` calls; `useSearchFilters` has no such fragmentation, so converting it would add a reducer file and ~5 action types for no clarity gain. The audit flagged the 267L `FilterSheet.tsx` size, but those lines are JSX/styles, not state management.

- [ ] **`bikes/BikeForm` — stop double-parsing on submit** (audit item 9 / `BikeForm.tsx:155-197` pre-refactor). After the BikeForm decomposition, `useBikeFormState.handleSubmit` still calls `validateBikeForm`, which re-runs `optionalNumberFromInput` on the same strings that `buildBikeFormDataFromFields` already parsed for `draftFormData`. Refactor: have validation consume `draftFormData` plus the raw strings (raw strings only needed to disambiguate "empty" from "invalid"), or change `validateBikeForm` to take a parsed input. Note: `validateBikeForm` has its own tests in `src/features/bikes/utils/__tests__/bikeFormValidation.test.ts` that pin the current signature — they will need to be updated.

- [ ] **`bikes/BikeForm` — `nameFieldValue` shadowing bug** (audit item 11 / `BikeForm.tsx:117-120` pre-refactor). When `name` is empty, the name input shows the auto-resolved `brand + model` value, but `onChangeText` writes to `name` — so the first keystroke replaces the displayed auto-name with just that one character. This is a UX behavior change, not a structural fix; needs a design decision. Options:
  - Render `name` directly and move the auto-resolved value into `placeholder`.
  - Split into a read-only `displayName` plus an explicit "Use auto" affordance.
  - Same pattern exists in `inventory/ItemForm` — fix should apply consistently.
