# Item form state — reducer + grouped state

Refactor `src/features/inventory/components/ItemForm/useItemFormState.ts` (419L, 29 `useState`s) and the section components that consume it. Theme 7 from `docs/plans/simplification-audit.md`.

## Problem

- 29 individual `useState`s in one hook.
- Cross-field rules (`CHANGE_CATEGORY` clearing usage/remaining; `TOGGLE_AVAILABILITY` Private-exclusivity; `ADD_TAG` dedup) live as scattered `useCallback`s.
- `ItemForm.tsx` re-unpacks the returned facade into 5–39 individual props per section. `OptionalSection` takes 39 props.

No behavior change desired — purely structural.

## Approach

1. **Reducer with grouped state** for in-form values:
   ```ts
   type ItemFormReducerState = {
     basic: { name; quantityStr; category?; subcategory; condition?; brand; model };
     availability: { types; price; deposit; borrowDuration; durationMenuVisible };
     visibility: { visibility; groupIds };
     optional: {
       showOptional;
       purchaseDate;
       mountedDate;
       age;
       ageMenuVisible;
       usage;
       storageLocation;
       storageMenuVisible;
       description;
       remainingPercentStr;
     };
     tags: { tags; input; suggestionsVisible };
     errors: ItemFormErrors;
   };
   ```
2. **Typed action union** (~25 actions). Cross-field rules implemented in the reducer.
3. **`useItemFormState` keeps current external signature** (params, returns the facade). Internals: one `useReducer` with lazy initializer; refs (`tagBlurCommitTimeoutRef`) stay outside the reducer; external hooks (`useBrandAutocomplete`, `useUserTags`, `useItems`, `useDistanceUnit`) unchanged.
4. **`ItemFormState` (facade) restructure** — instead of 50 flat fields, expose grouped state slices, derived values, and named actions:
   ```ts
   { basic, availability, visibility, optional, tags, errors,
     // derived
     nameFieldValue, currentSubcategories, existingStorageLocations,
     filteredTagSuggestions, isSellable, isBorrowable, isDirty,
     // brand autocomplete (already a sub-API)
     brand: { value, menuVisible, filtered, onSelect, onInputChange, onFocus, onBlur, cancelBlurTimeout },
     // actions
     setName, setQuantityStr, changeCategory, setSubcategory, setCondition, setModel,
     toggleAvailability, setPrice, setDeposit, setBorrowDuration, setDurationMenuVisible,
     setVisibility, toggleGroup,
     setShowOptional, setPurchaseDate, setMountedDate, setAge, setAgeMenuVisible,
     setUsage, setStorageLocation, setStorageMenuVisible, setDescription, setRemainingPercentStr,
     setTagInput, setTagSuggestionsVisible, addTag, removeTag,
     clearTagBlurCommitTimeout, tagBlurCommitTimeoutRef,
     handleSubmit, distanceUnit }
   ```
5. **Sections take `{ state, inputStyling }`** (plus `errors` if more ergonomic). `OptionalSection` 39→2 props. `ItemForm.tsx` shrinks to ~30L.

## Tests

- Existing `OptionalSection.test.tsx` runs unchanged after section API update — drives correctness for the optional fields panel.
- New `useItemFormState.test.tsx` (or reducer-only `itemFormReducer.test.ts`) covers cross-field rules:
  - `CHANGE_CATEGORY` to/from `Consumable` clears `usage` / `remainingPercentStr` correctly.
  - `TOGGLE_AVAILABILITY(Private)` clears non-private types; toggling a non-private type removes Private.
  - `ADD_TAG` deduplicates and trims; tag input is reset.
  - `handleSubmit` flushes pending tag input and produces equivalent `ItemFormData` to current behavior.
- Manual smoke: `npm run dev` → create item, edit item, toggle availability, change category, add/remove tags, submit.

## Risk

The reducer rewrite must preserve every cross-field side-effect from the current `useCallback`s. Mitigation: existing tests + new reducer unit tests + manual smoke.

## Out of scope

- Bikes `BikeForm` decomposition (theme 7 sub-item) — separate PR.
- `search/FilterSheet` — separate PR.
- Any change to `ItemFormData` shape, validation, or submit pipeline.

## Worktree / PR

- Branch: `refactor/item-form-state-reducer`
- Worktree: `.worktrees/item-form-state-reducer/`
- Single PR to `main`.
