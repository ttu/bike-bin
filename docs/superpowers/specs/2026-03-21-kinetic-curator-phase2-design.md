# Kinetic Curator Phase 2: Component Upgrades Design Spec

## Goal

Upgrade three component families — buttons, chips, and input fields — to match the Kinetic Curator design system. These are component-level changes that cascade across all screens.

## Architecture

Three parallel workstreams, each producing a shared component or styling pattern applied across the codebase:

1. **GradientButton** — new shared component replacing all `mode="contained"` Paper Buttons
2. **Chip restyling** — consistent props/styles applied to all Paper Chip usages
3. **Soft inputs** — Paper TextInput mode change + styling, plus RN TextInput styling for custom inputs

## Components

### A. GradientButton

**New file:** `src/shared/components/GradientButton/GradientButton.tsx`

**Visual spec:**

- 135-degree linear gradient from `primary` (#006857) to `primaryContainer` (#00846e)
- `borderRadius: 12` (rounded-xl)
- Text: `labelLarge` variant, uppercase, `onPrimary` (#ffffff) color
- Height: 48px (matches Paper Button contained height)
- Horizontal padding: 24px
- Disabled state: gradient replaced with `surfaceVariant` background, `onSurfaceVariant` text
- Loading state: `ActivityIndicator` in `onPrimary` color replaces text
- Ambient shadow on the button: `0 4px 12px` using `onSurface` at 8% opacity

**Props interface:**

```typescript
interface GradientButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}
```

**Implementation:** Uses `expo-linear-gradient` (already installed) wrapping a `Pressable`. Reads theme colors via `useTheme<AppTheme>()`.

**Export:** Add to `src/shared/components/index.ts` barrel export.

**Replacement targets (13 usages):**

1. `src/shared/components/EmptyState/EmptyState.tsx:36`
2. `src/features/auth/components/AuthGate/AuthGate.tsx:56`
3. `src/features/ratings/components/RatingPrompt/RatingPrompt.tsx:127`
4. `src/features/search/components/ListingDetail/ListingDetail.tsx:136` (sign-in disabled)
5. `src/features/search/components/ListingDetail/ListingDetail.tsx:143` (contact)
6. `src/features/search/components/ListingDetail/ListingDetail.tsx:152` (request borrow — only when `showBoth`, keep `mode="outlined"` Paper Button)
7. `src/features/search/components/FilterSheet/FilterSheet.tsx:194`
8. `src/features/borrow/components/BorrowRequestCard/BorrowRequestCard.tsx:135` (accept)
9. `src/features/borrow/components/BorrowRequestCard/BorrowRequestCard.tsx:168` (mark returned)
10. `src/features/locations/components/LocationForm/LocationForm.tsx:180`
11. `src/features/inventory/components/ItemForm/ItemForm.tsx:667`
12. `src/features/inventory/components/ItemDetail/ItemDetail.tsx:124`
13. `src/features/bikes/components/BikeForm/BikeForm.tsx:145`
14. `src/shared/components/ReportDialog/ReportDialog.tsx:113`

**Note:** ListingDetail line 152 ("Request Borrow") uses `mode="outlined"` when `showBoth` is true — leave that as a Paper Button. Only replace `mode="contained"` instances.

### B. Filter Chip Restyling

**No new component.** Apply consistent styling to all existing Paper `Chip` usages.

**Visual spec:**

- **Unselected:** `backgroundColor: secondaryContainer` (#cae9e3), `borderRadius: 9999` (pill shape)
- **Selected:** `backgroundColor: primary` (#006857), text color `onPrimary` (#ffffff) via `selectedColor` prop
- Remove existing inline `primaryContainer` background overrides for selected state
- Add `showSelectedCheck={false}` to prevent the default checkmark icon (the color change is sufficient)

**Pattern — every Chip gets:**

```tsx
<Chip
  selected={isActive}
  onPress={onToggle}
  selectedColor={theme.colors.onPrimary}
  showSelectedCheck={false}
  style={[
    styles.chip,  // borderRadius: 9999
    { backgroundColor: isActive ? theme.colors.primary : theme.colors.secondaryContainer },
  ]}
>
```

**Chip targets:**

- `ItemForm.tsx` — 7 chip groups (category, subcategory, condition, availability, visibility, group selection, usage unit)
- `FilterSheet.tsx` — 3 chip groups (category, condition, offer type)
- `ItemDetail.tsx` — status chip (keep as-is, it uses custom status colors) + availability chips
- `ListingDetail.tsx` — availability chips
- `BikeForm.tsx` — bike type chips
- `GroupDetail [id].tsx` — public/private badge chip

**Exclusion:** The status chip in ItemDetail uses custom status colors (success/warning/outline) — do NOT restyle this one.

### C. Soft Input Fields

**No new component.** Change Paper TextInput props and add consistent styling.

**Visual spec — Paper TextInput:**

- Change `mode="outlined"` to `mode="flat"` across all usages
- Background: `surfaceContainerHighest` from `customColors`
- Underline color (unfocused): `outlineVariant` at 15% opacity → `outlineVariant + '26'` hex
- Underline color (focused): `primary` at 100%
- Border radius: 12px on the container via `style` prop
- Focus glow: Not natively supported by Paper TextInput — skip the 4px glow to avoid complexity. The color transition to primary is sufficient.

**Props pattern:**

```tsx
<TextInput
  mode="flat"
  style={{ backgroundColor: theme.customColors.surfaceContainerHighest, borderRadius: 12 }}
  underlineColor={theme.colors.outlineVariant + '26'}
  activeUnderlineColor={theme.colors.primary}
  // ... existing props
/>
```

**Paper TextInput targets (18 usages):**

- `ItemForm.tsx` — 11 TextInputs (name, brand, model, price, deposit, duration menu, age menu, usage, storage, description + any others)
- `BikeForm.tsx` — 4 TextInputs (name, brand, model, year)
- `LocationForm.tsx` — 2 TextInputs (postcode, label)
- `RatingPrompt.tsx` — 1 TextInput (comment)
- `ReportDialog.tsx` — 1 TextInput (details)
- `GroupDetail [id].tsx` — 2 TextInputs (name, description in edit mode)

**RN TextInput targets (custom styled):**

- `FilterSheet.tsx` — 2 price inputs: apply `backgroundColor: surfaceContainerHighest`, `borderRadius: 12`, `borderColor: outlineVariant + '26'`
- `messages/[id].tsx` — chat input: apply `backgroundColor: surfaceContainerHighest`, `borderRadius: 12`

**Paper Searchbar:**

- `SearchBar.tsx` — change `searchbarBg` from `surfaceVariant` to `surfaceContainerHighest`, update `borderRadius` to 12

## Testing

- All existing tests must continue to pass after changes
- Update test snapshots if any exist
- No new test files needed — these are purely visual/styling changes

## Files Modified (Summary)

**New files (1):**

- `src/shared/components/GradientButton/GradientButton.tsx`

**Modified files (~15):**

- `src/shared/components/index.ts` (export GradientButton)
- `src/shared/components/EmptyState/EmptyState.tsx`
- `src/features/auth/components/AuthGate/AuthGate.tsx`
- `src/features/ratings/components/RatingPrompt/RatingPrompt.tsx`
- `src/features/search/components/ListingDetail/ListingDetail.tsx`
- `src/features/search/components/FilterSheet/FilterSheet.tsx`
- `src/features/search/components/SearchBar/SearchBar.tsx`
- `src/features/borrow/components/BorrowRequestCard/BorrowRequestCard.tsx`
- `src/features/locations/components/LocationForm/LocationForm.tsx`
- `src/features/inventory/components/ItemForm/ItemForm.tsx`
- `src/features/inventory/components/ItemDetail/ItemDetail.tsx`
- `src/features/bikes/components/BikeForm/BikeForm.tsx`
- `src/shared/components/ReportDialog/ReportDialog.tsx`
- `app/(tabs)/messages/[id].tsx`
- `app/(tabs)/profile/groups/[id].tsx`
