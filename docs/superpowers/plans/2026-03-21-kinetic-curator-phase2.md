# Kinetic Curator Phase 2: Component Upgrades Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade buttons (gradient CTA), chips (pill restyling), and input fields (soft filled) to match the Kinetic Curator design system.

**Architecture:** Create one new shared component (GradientButton), then apply consistent styling patterns to existing Chip and TextInput usages across ~15 files.

**Tech Stack:** React Native, React Native Paper (MD3), expo-linear-gradient, TypeScript

---

## Task 1: Create GradientButton Component

**Files:**

- Create: `src/shared/components/GradientButton/GradientButton.tsx`
- Create: `src/shared/components/GradientButton/index.ts`
- Modify: `src/shared/components/index.ts`

- [ ] **Step 1: Create GradientButton component**

Create `src/shared/components/GradientButton/GradientButton.tsx`:

```tsx
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AppTheme } from '@/shared/theme';

interface GradientButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function GradientButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: GradientButtonProps) {
  const theme = useTheme<AppTheme>();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.wrapper,
        !isDisabled && styles.shadow,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={
          isDisabled
            ? [theme.colors.surfaceVariant, theme.colors.surfaceVariant]
            : [theme.colors.primary, theme.colors.primaryContainer]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator
            color={isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}
            size="small"
          />
        ) : (
          <Text
            variant="labelLarge"
            style={[
              styles.label,
              { color: isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary },
            ]}
          >
            {children}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  gradient: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
  },
  shadow: {
    shadowColor: '#181c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    textTransform: 'uppercase' as const,
  },
});
```

- [ ] **Step 2: Create barrel export**

Create `src/shared/components/GradientButton/index.ts`:

```ts
export { GradientButton } from './GradientButton';
```

- [ ] **Step 3: Add to shared components barrel**

In `src/shared/components/index.ts`, add:

```ts
export { GradientButton } from './GradientButton';
```

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: All existing tests pass (no tests for GradientButton yet — purely visual component).

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/GradientButton/ src/shared/components/index.ts
git commit -m "feat: add GradientButton component with linear gradient CTA styling"
```

---

## Task 2: Replace All mode="contained" Buttons with GradientButton

**Files:**

- Modify: `src/shared/components/EmptyState/EmptyState.tsx`
- Modify: `src/features/auth/components/AuthGate/AuthGate.tsx`
- Modify: `src/features/ratings/components/RatingPrompt/RatingPrompt.tsx`
- Modify: `src/features/search/components/ListingDetail/ListingDetail.tsx`
- Modify: `src/features/search/components/FilterSheet/FilterSheet.tsx`
- Modify: `src/features/borrow/components/BorrowRequestCard/BorrowRequestCard.tsx`
- Modify: `src/features/locations/components/LocationForm/LocationForm.tsx`
- Modify: `src/features/inventory/components/ItemForm/ItemForm.tsx`
- Modify: `src/features/inventory/components/ItemDetail/ItemDetail.tsx`
- Modify: `src/features/bikes/components/BikeForm/BikeForm.tsx`
- Modify: `src/shared/components/ReportDialog/ReportDialog.tsx`

**Pattern for each file:**

1. Add import: `import { GradientButton } from '@/shared/components';`
2. Replace `<Button mode="contained" ...>` with `<GradientButton ...>`
3. Move `loading` and `disabled` props directly (same API)
4. Move `onPress` prop directly
5. Remove `mode="contained"` (not needed)
6. Remove `Button` from import if no other Button modes remain; keep if `mode="outlined"` or `mode="text"` buttons still exist
7. Keep existing `style` props for spacing (marginTop, marginBottom etc.)

**Specific replacements per file:**

### EmptyState.tsx (line 36)

```tsx
// Before
<Button mode="contained" onPress={onCtaPress} style={styles.button}>
  {ctaLabel}
</Button>

// After
<GradientButton onPress={onCtaPress} style={styles.button}>
  {ctaLabel}
</GradientButton>
```

Remove `Button` from `react-native-paper` import. Add `GradientButton` import from `@/shared/components`.

### AuthGate.tsx (line 56)

Replace `<Button mode="contained"` with `<GradientButton`. Remove `Button` import if unused.

### RatingPrompt.tsx (line 127)

Replace save/submit button. Keep `loading` and `disabled` props.

### ListingDetail.tsx (lines 136, 143)

- Line 136 (sign-in disabled): Replace with `<GradientButton disabled>`.
- Line 143 (contact): Replace with `<GradientButton>`.
- Line 152 (request borrow with `mode="outlined"` when showBoth): Leave as Paper Button.
- Line 152 (request borrow with `mode="contained"` when showBorrowOnly): Replace with `<GradientButton>`.
- Keep `Button` import for the outlined variant.

### FilterSheet.tsx (line 194)

Replace "Show results" button. Remove `Button` import (only remaining is `mode="text"` reset — keep that one, so keep `Button` import).

### BorrowRequestCard.tsx (lines 135, 168)

Replace both `mode="contained"` buttons (accept, mark returned). Keep `Button` import for `mode="outlined"` buttons.

### LocationForm.tsx (line 180)

Replace save button. Keep `loading` and `disabled` props.

### ItemForm.tsx (line 667)

Replace save button. Keep `loading` and `disabled` props.

### ItemDetail.tsx (line 124)

Replace "Mark returned" button. Keep `Button` import for outlined buttons.

### BikeForm.tsx (line 145)

Replace save button. Keep `loading` and `disabled` props. Keep `Button` import for delete button.

### ReportDialog.tsx (line 113)

Replace submit button. Keep `loading` and `disabled` props.

- [ ] **Step 1: Replace buttons in shared components (EmptyState, ReportDialog)**

- [ ] **Step 2: Replace buttons in feature components (all remaining files)**

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All tests pass. Some tests may need import updates if they reference Button from Paper.

- [ ] **Step 4: Run lint and type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: No errors. Unused Button imports should be caught by lint.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: replace all contained buttons with GradientButton component"
```

---

## Task 3: Restyle All Chips to Pill Shape

**Files:**

- Modify: `src/features/inventory/components/ItemForm/ItemForm.tsx`
- Modify: `src/features/search/components/FilterSheet/FilterSheet.tsx`
- Modify: `src/features/inventory/components/ItemDetail/ItemDetail.tsx`
- Modify: `src/features/search/components/ListingDetail/ListingDetail.tsx`
- Modify: `src/features/bikes/components/BikeForm/BikeForm.tsx`
- Modify: `app/(tabs)/profile/groups/[id].tsx`

**Pattern for selectable chips (ItemForm, FilterSheet, BikeForm):**

Replace:

```tsx
<Chip
  selected={isActive}
  onPress={handler}
  style={[
    styles.chip,
    isActive && { backgroundColor: theme.colors.primaryContainer },
  ]}
>
```

With:

```tsx
<Chip
  selected={isActive}
  onPress={handler}
  showSelectedCheck={false}
  selectedColor={theme.colors.onPrimary}
  style={[
    styles.chip,
    { backgroundColor: isActive ? theme.colors.primary : theme.colors.secondaryContainer },
  ]}
>
```

Ensure `styles.chip` has `borderRadius: 9999` (pill). In files that already use `borderRadius.full` (like BikeForm), this is already correct. For others, add it.

**Pattern for display-only chips (ItemDetail availability, ListingDetail availability):**

Replace default Paper Chip styling with:

```tsx
<Chip
  compact
  style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 9999 }}
>
```

**Exclusions:**

- ItemDetail status chip (line 60) — uses custom status colors, leave as-is
- GroupDetail public/private badge chip — apply secondaryContainer + pill styling (display-only)

### ItemForm.tsx — 7 chip groups

All chip groups in ItemForm follow the same pattern. The `styles.chip` in ItemForm currently has no `borderRadius` override, so add `borderRadius: 9999` to the chip style. Remove all inline `backgroundColor: theme.colors.primaryContainer` conditionals and replace with the new pattern.

For compact unit chips (km/mi), same pattern but keep `compact` prop.

### FilterSheet.tsx — 3 chip groups

FilterSheet uses `themed.activeChipBg` for selected state. Replace with inline styling per the pattern. Update `useThemedStyles` to remove `activeChipBg` (no longer needed). Add `selectedChipBg` and `unselectedChipBg` if desired, or inline.

### ItemDetail.tsx — availability chips (line 83)

Add `style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 9999 }}`.

### ListingDetail.tsx — availability chips (line 67)

Add `style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 9999 }}`.

### BikeForm.tsx — bike type chips

Already has `borderRadius: borderRadius.full` in `styles.chip`. Replace `primaryContainer` conditional with new pattern.

### GroupDetail [id].tsx — public/private badge

Add pill styling to the badge chip.

- [ ] **Step 1: Update ItemForm chips (7 groups)**

- [ ] **Step 2: Update FilterSheet chips (3 groups)**

- [ ] **Step 3: Update BikeForm chips (1 group)**

- [ ] **Step 4: Update display chips (ItemDetail, ListingDetail, GroupDetail)**

- [ ] **Step 5: Run tests**

Run: `npm run test`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: restyle chips with pill shape and primary/secondary-container colors"
```

---

## Task 4: Soft Input Fields — Paper TextInput

**Files:**

- Modify: `src/features/inventory/components/ItemForm/ItemForm.tsx`
- Modify: `src/features/bikes/components/BikeForm/BikeForm.tsx`
- Modify: `src/features/locations/components/LocationForm/LocationForm.tsx`
- Modify: `src/features/ratings/components/RatingPrompt/RatingPrompt.tsx`
- Modify: `src/shared/components/ReportDialog/ReportDialog.tsx`
- Modify: `app/(tabs)/profile/groups/[id].tsx`

**Pattern for every Paper TextInput:**

Replace:

```tsx
<TextInput
  mode="outlined"
  value={value}
  ...
/>
```

With:

```tsx
<TextInput
  mode="flat"
  value={value}
  style={{ backgroundColor: theme.customColors.surfaceContainerHighest, borderRadius: 12 }}
  underlineColor={theme.colors.outlineVariant + '26'}
  activeUnderlineColor={theme.colors.primary}
  ...
/>
```

The `'26'` hex suffix = 15% opacity (38/255 = 0.149 ≈ 15%, hex 26).

**Per-file details:**

### ItemForm.tsx — 11 TextInputs

All `mode="outlined"` TextInputs (name, brand, model, price, deposit, duration menu, age menu, usage, storage, description, and any menu-trigger inputs). For menu-trigger TextInputs (duration, age) that use `editable={false}`, apply the same style.

Add to `useThemedStyles` or create a shared `softInputStyle`:

```tsx
softInput: {
  backgroundColor: theme.customColors.surfaceContainerHighest,
  borderRadius: 12,
}
```

### BikeForm.tsx — 4 TextInputs

Name, brand, model, year. Need `useTheme<AppTheme>()` cast (currently uses `useTheme()` without generic).

### LocationForm.tsx — 2 TextInputs

Postcode, label. Check if it already uses `AppTheme` typing.

### RatingPrompt.tsx — 1 TextInput

Comment/review text.

### ReportDialog.tsx — 1 TextInput

Report details.

### GroupDetail [id].tsx — 2 TextInputs

Edit name, edit description.

- [ ] **Step 1: Update ItemForm TextInputs**

- [ ] **Step 2: Update BikeForm TextInputs**

- [ ] **Step 3: Update LocationForm, RatingPrompt, ReportDialog TextInputs**

- [ ] **Step 4: Update GroupDetail TextInputs**

- [ ] **Step 5: Run tests**

Run: `npm run test`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: soft input fields with filled background and ghost borders"
```

---

## Task 5: Soft Input Fields — Custom Inputs (SearchBar, Chat, FilterSheet)

**Files:**

- Modify: `src/features/search/components/SearchBar/SearchBar.tsx`
- Modify: `src/features/search/components/FilterSheet/FilterSheet.tsx`
- Modify: `app/(tabs)/messages/[id].tsx`

### SearchBar.tsx

Change `searchbarBg` from `surfaceVariant` to `surfaceContainerHighest`:

```tsx
searchbarBg: { backgroundColor: theme.customColors.surfaceContainerHighest },
```

Update searchbar `borderRadius` from `borderRadius.sm` to `12`:

```tsx
searchbar: {
  borderRadius: 12,
  elevation: 0,
},
```

### FilterSheet.tsx — 2 RN TextInput price inputs

Update the `priceInput` style:

```tsx
priceInput: {
  flex: 1,
  borderWidth: 1,
  borderRadius: 12,
  padding: spacing.sm,
},
```

Update `outlineBorder` in themed styles:

```tsx
outlineBorder: { borderColor: theme.colors.outlineVariant + '26' },
```

Add background color via new themed style or inline:

```tsx
priceInputBg: { backgroundColor: theme.customColors.surfaceContainerHighest },
```

### messages/[id].tsx — chat input

Update `textInput` style:

```tsx
textInput: {
  flex: 1,
  borderRadius: 12,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  maxHeight: 100,
  fontSize: 16,
},
```

Change the inline `backgroundColor` from `surfaceVariant` to `surfaceContainerHighest`:

```tsx
backgroundColor: theme.customColors.surfaceContainerHighest,
```

- [ ] **Step 1: Update SearchBar**

- [ ] **Step 2: Update FilterSheet price inputs**

- [ ] **Step 3: Update chat input**

- [ ] **Step 4: Run tests**

Run: `npm run test`

- [ ] **Step 5: Run full validation**

Run: `npm run validate`
Expected: All format, lint, type-check, test, and build checks pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: soft styling for SearchBar, chat input, and price filter inputs"
```
