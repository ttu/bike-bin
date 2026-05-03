# Follow-up tasks

Deferred work spun out of in-flight PRs. Each item is small enough to land in its own PR.

## From theme 7 (form-state decomposition)

- [ ] **`search/FilterSheet` reducer refactor** — verify and apply the same `useReducer` + grouped-state pattern used by `inventory/ItemForm` (#96) and `bikes/BikeForm`. Spec: `docs/superpowers/specs/2026-05-02-item-form-state-reducer-design.md` lists this as out of scope; audit theme 7 references `search/FilterSheet/FilterSheet.tsx` (267L).

- [ ] **`bikes/BikeForm` — stop double-parsing on submit** (audit item 9 / `BikeForm.tsx:155-197` pre-refactor). After the BikeForm decomposition, `useBikeFormState.handleSubmit` still calls `validateBikeForm`, which re-runs `optionalNumberFromInput` on the same strings that `buildBikeFormDataFromFields` already parsed for `draftFormData`. Refactor: have validation consume `draftFormData` plus the raw strings (raw strings only needed to disambiguate "empty" from "invalid"), or change `validateBikeForm` to take a parsed input. Note: `validateBikeForm` has its own tests in `src/features/bikes/utils/__tests__/bikeFormValidation.test.ts` that pin the current signature — they will need to be updated.

- [ ] **`bikes/BikeForm` — `nameFieldValue` shadowing bug** (audit item 11 / `BikeForm.tsx:117-120` pre-refactor). When `name` is empty, the name input shows the auto-resolved `brand + model` value, but `onChangeText` writes to `name` — so the first keystroke replaces the displayed auto-name with just that one character. This is a UX behavior change, not a structural fix; needs a design decision. Options:
  - Render `name` directly and move the auto-resolved value into `placeholder`.
  - Split into a read-only `displayName` plus an explicit "Use auto" affordance.
  - Same pattern exists in `inventory/ItemForm` — fix should apply consistently.
