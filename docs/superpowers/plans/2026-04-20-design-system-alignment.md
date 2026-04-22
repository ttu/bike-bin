# Design System Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Bike Bin codebase with the Claude Design design system — accent tokens, no card shadows, hairline borders, display-figure typography, community accent colors, asymmetric search grid, and grouped inventory list.

**Architecture:** Three phases of changes. Phase 1 adds foundation tokens and removes shadows. Phase 2 introduces the DisplayFigure component and hairline patterns. Phase 3 refactors search and inventory list layouts. Each task is independently committable.

**Tech Stack:** React Native, TypeScript, React Native Paper (MD3), expo-font (Big Shoulders Display + Manrope), react-native-svg

**Spec:** `docs/superpowers/specs/2026-04-20-design-system-alignment-design.md`

**Worktree:** `.worktrees/design-system-alignment/` (branch: `feat/design-system-alignment`)

**Test commands:**

- Type check: `npm run type-check`
- Unit tests: `npm run test`
- Lint: `npm run lint`
- Full validate: `npm run validate`

---

## Phase 1: Foundation Tokens

### Task 1: Add accent color tokens to theme

**Files:**

- Modify: `src/shared/theme/theme.ts:4-19` (CustomColors interface), `:101-116` (light customColors), `:152-167` (dark customColors)

- [ ] **Step 1: Add accent tokens to CustomColors interface**

In `src/shared/theme/theme.ts`, add four fields after `inversePrimary` (line 18):

```typescript
export interface CustomColors {
  success: string;
  warning: string;
  warningContainer: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceBright: string;
  surfaceDim: string;
  primaryFixedDim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  // Oxidized orange accent — community seams only (groups, lending, messaging).
  // Never on primary CTAs. Rare editorial emphasis ("recently added", featured highlights).
  accent: string;
  accentContainer: string;
  onAccent: string;
  accentTint: string;
}
```

- [ ] **Step 2: Add light theme accent values**

In `lightTheme.customColors` (after `inversePrimary: '#5ddbbe'`, line 115):

```typescript
    accent: '#b8572e',
    accentContainer: '#e6c1ad',
    onAccent: '#ffffff',
    accentTint: 'rgba(184, 87, 46, 0.18)',
```

- [ ] **Step 3: Add dark theme accent values**

In `darkTheme.customColors` (after `inversePrimary: '#006857'`, line 166):

```typescript
    accent: '#e89868',
    accentContainer: '#5a2a10',
    onAccent: '#2a0f00',
    accentTint: 'rgba(232, 152, 104, 0.20)',
```

- [ ] **Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS — no type errors (all consumers of `CustomColors` still satisfy the interface since we only added fields)

- [ ] **Step 5: Commit**

```bash
git add src/shared/theme/theme.ts
git commit -m "feat: add accent color tokens (oxidized orange) to theme"
```

---

### Task 2: Remove card shadows

**Files:**

- Modify: `src/features/inventory/components/ItemCard/ItemCard.tsx:164-169`
- Modify: `src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx:141-145`
- Modify: `src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx:124-130`
- Modify: `app/(tabs)/_layout.tsx:84-87`

- [ ] **Step 1: Remove shadow from ItemCard**

In `src/features/inventory/components/ItemCard/ItemCard.tsx`, remove lines 166-169 from `styles.container` and the `shadowColor` from the inline style (line 46). The container style should become:

```typescript
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
  },
```

And the inline style array (lines 43-47) loses `shadowColor`:

```typescript
      style={[
        styles.container,
        {
          backgroundColor: theme.customColors.surfaceContainerLowest,
        },
      ]}
```

- [ ] **Step 2: Remove shadow from FeaturedItemCard**

In `src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx`, remove lines 141-145 from `getStyles().container` and the `shadowColor` reference. The container style should become:

```typescript
    container: {
      borderRadius: borderRadius.lg,
      marginHorizontal: spacing.base,
      marginVertical: spacing.xs,
      backgroundColor: theme.customColors.surfaceContainerLowest,
      overflow: 'hidden' as const,
    },
```

- [ ] **Step 3: Remove shadow from SearchResultGridCard**

In `src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx`, remove the entire `shadow` style from `useThemedStyles` (lines 124-130). Then remove `themed.shadow` from the inline style array (line 43).

The style array becomes:

```typescript
      style={[
        styles.container,
        { width: cardWidth, marginBottom: SEARCH_GRID_COLUMN_GAP },
        themed.surfaceBg,
      ]}
```

- [ ] **Step 4: Remove shadow from tab bar**

In `app/(tabs)/_layout.tsx`, remove lines 84-87 from `tabBarStyles.container`:

```typescript
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
```

Also remove the `shadowColor` reference from the inline style (line 26). The inline style becomes:

```typescript
        {
          paddingBottom: insets.bottom,
          backgroundColor: theme.customColors.surfaceContainer,
          borderTopColor: theme.colors.outlineVariant,
        },
```

- [ ] **Step 5: Run tests and update any failing assertions**

Run: `npm run test`

If any existing tests in `ItemCard.test.tsx`, `FeaturedItemCard.test.tsx`, or `SearchResultGridCard.test.tsx` assert shadow-related style properties (shadowOffset, shadowOpacity, shadowRadius, elevation, shadowColor), update those assertions to reflect shadow removal. Check each test file for shadow references before running.

Expected: PASS after any assertion updates

- [ ] **Step 6: Commit**

```bash
git add src/features/inventory/components/ItemCard/ItemCard.tsx \
  src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx \
  src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx \
  app/\(tabs\)/_layout.tsx \
  src/features/inventory/components/ItemCard/__tests__/ \
  src/features/inventory/components/FeaturedItemCard/__tests__/ \
  src/features/search/components/SearchResultGridCard/__tests__/
git commit -m "refactor: remove card shadows — surface-step contrast only"
```

---

### Task 3: Add logo SVG assets

**Files:**

- Create: `assets/logo-mark.svg`
- Create: `assets/logo-lockup.svg`

- [ ] **Step 1: Copy logo-mark.svg from design bundle**

Copy `/tmp/design-extract/bike-bin-design-system/project/assets/logo-mark.svg` to `assets/logo-mark.svg` in the worktree.

> **Note:** If `/tmp/design-extract/` no longer exists, re-extract the design bundle: `cd /tmp && gunzip -f design.gz && tar xf design -C design-extract`

- [ ] **Step 2: Copy logo-lockup.svg from design bundle**

Copy `/tmp/design-extract/bike-bin-design-system/project/assets/logo-lockup.svg` to `assets/logo-lockup.svg` in the worktree.

- [ ] **Step 3: Commit**

```bash
git add assets/logo-mark.svg assets/logo-lockup.svg
git commit -m "feat: add Socket BB logo mark and lockup SVGs"
```

---

## Phase 2: Component Patterns

### Task 4: Create DisplayFigure component

**Files:**

- Create: `src/shared/components/DisplayFigure/DisplayFigure.tsx`
- Create: `src/shared/components/DisplayFigure/DisplayFigure.test.tsx`
- Create: `src/shared/components/DisplayFigure/index.ts`
- Modify: `src/shared/components/index.ts` (add export)

- [ ] **Step 1: Write the failing test**

Create `src/shared/components/DisplayFigure/DisplayFigure.test.tsx`:

```typescript
import { StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { DisplayFigure } from './DisplayFigure';

describe('DisplayFigure', () => {
  it('renders value text', () => {
    renderWithProviders(<DisplayFigure value="11-34" />);
    expect(screen.getByText('11-34')).toBeTruthy();
  });

  it('renders unit when provided', () => {
    renderWithProviders(<DisplayFigure value="269" unit="g" />);
    expect(screen.getByText('g')).toBeTruthy();
  });

  it('renders note when provided', () => {
    renderWithProviders(<DisplayFigure value="40" unit="%" note="wear" />);
    expect(screen.getByText('wear')).toBeTruthy();
  });

  it('does not render unit or note when omitted', () => {
    renderWithProviders(<DisplayFigure value="2022" />);
    expect(screen.getByText('2022')).toBeTruthy();
    expect(screen.queryByText('wear')).toBeNull();
  });

  it('uses BigShoulders-ExtraBold for value', () => {
    renderWithProviders(<DisplayFigure value="175" />);
    const valueText = screen.getByText('175');
    const flatStyle = StyleSheet.flatten(valueText.props.style);
    expect(flatStyle).toEqual(
      expect.objectContaining({ fontFamily: 'BigShoulders-ExtraBold' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --testPathPattern=DisplayFigure`
Expected: FAIL — module not found

- [ ] **Step 3: Write DisplayFigure component**

Create `src/shared/components/DisplayFigure/DisplayFigure.tsx`:

```typescript
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { spacing } from '@/shared/theme';

interface DisplayFigureProps {
  /** The numeric/spec value to display, e.g. "11-34", "40", "269" */
  value: string;
  /** Unit label rendered beside the value, e.g. "T", "%", "g", "km" */
  unit?: string;
  /** Descriptive note rendered below, e.g. "range", "wear". Expects already-translated string. */
  note?: string;
  /** Font size for the value. Default 32. Unit and note sizes are derived from this. */
  size?: number;
}

export function DisplayFigure({ value, unit, note, size = 32 }: DisplayFigureProps) {
  const theme = useTheme<AppTheme>();
  const unitSize = Math.round(size * 0.22);
  const letterSpacing = size * -0.02;
  const lineHeight = Math.round(size * 0.95);

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            {
              fontSize: size,
              letterSpacing,
              lineHeight,
              color: theme.colors.onBackground,
              ...Platform.select({
                web: { fontVariantNumeric: 'tabular-nums' } as Record<string, string>,
                default: {},
              }),
            },
          ]}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={[
              styles.unit,
              {
                fontSize: unitSize,
                color: theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {unit}
          </Text>
        )}
      </View>
      {note && (
        <Text
          style={[
            styles.note,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {note}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    fontFamily: 'BigShoulders-ExtraBold',
    fontWeight: '800',
  },
  unit: {
    fontFamily: 'Manrope-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  note: {
    fontFamily: 'Manrope-SemiBold',
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: spacing.xs / 2,
  },
});
```

- [ ] **Step 4: Create barrel file**

Create `src/shared/components/DisplayFigure/index.ts`:

```typescript
export { DisplayFigure } from './DisplayFigure';
```

- [ ] **Step 5: Add export to shared components index**

In `src/shared/components/index.ts`, add after the `DetailCard` export (line 8):

```typescript
export { DisplayFigure } from './DisplayFigure';
```

- [ ] **Step 6: Run tests**

Run: `npm run test -- --testPathPattern=DisplayFigure`
Expected: PASS

- [ ] **Step 7: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/shared/components/DisplayFigure/ src/shared/components/index.ts
git commit -m "feat: add DisplayFigure component for spec number typography"
```

---

### Task 5: Add hairline borders to ItemDetail

**Files:**

- Modify: `src/features/inventory/components/ItemDetail/ItemDetail.tsx:339-355` (SpecRow), `:454-459` (specRow style), `:151-203` (detail cards section)

- [ ] **Step 1: Fix SpecRow hairline color**

In `src/features/inventory/components/ItemDetail/ItemDetail.tsx`, change the SpecRow border color (line 344) from `colorWithAlpha(theme.colors.outlineVariant, 0.25)` to `theme.colors.outlineVariant`:

```typescript
      style={[
        styles.specRow,
        { borderBottomColor: theme.colors.outlineVariant },
      ]}
```

- [ ] **Step 2: Add hairline separators between detail sections**

Add `borderBottomWidth: StyleSheet.hairlineWidth` and `borderBottomColor` to the `section` style in `styles` (line 404-407):

```typescript
  section: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
```

Then add `borderBottomColor: theme.colors.outlineVariant` to the section `View`s inline or via the themed styles. Add to `useThemedStyles`:

```typescript
        sectionBorder: { borderBottomColor: theme.colors.outlineVariant },
```

Apply `themed.sectionBorder` to each `<View style={styles.section}>` in the component.

- [ ] **Step 3: Run tests**

Run: `npm run test -- --testPathPattern=ItemDetail`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/inventory/components/ItemDetail/ItemDetail.tsx
git commit -m "refactor: use outlineVariant hairlines in ItemDetail sections"
```

---

### Task 6: Wire accent color into FeaturedItemCard badge

**Files:**

- Modify: `src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx:170-181`

- [ ] **Step 1: Change "recently added" badge to accent color**

In `src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx`, change `recentBadge.backgroundColor` (line 177) from:

```typescript
      backgroundColor: colorWithAlpha(theme.colors.primary, 0.9),
```

to:

```typescript
      backgroundColor: theme.customColors.accent,
```

And change `recentBadgeText.color` (line 180) from:

```typescript
      color: theme.colors.onPrimary,
```

to:

```typescript
      color: theme.customColors.onAccent,
```

- [ ] **Step 2: Run tests and update assertions if needed**

Run: `npm run test -- --testPathPattern=FeaturedItemCard`

If `FeaturedItemCard.test.tsx` asserts badge background color (e.g., checking for `colorWithAlpha(primary, 0.9)`), update those assertions to expect `accent` / `onAccent` theme colors instead.

Expected: PASS after any assertion updates

- [ ] **Step 3: Commit**

```bash
git add src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx \
  src/features/inventory/components/FeaturedItemCard/__tests__/
git commit -m "refactor: use accent color for FeaturedItemCard 'recently added' badge"
```

---

### Task 7: Integrate DisplayFigure into FeaturedItemCard

**Files:**

- Modify: `src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx:115-128`

- [ ] **Step 1: Import DisplayFigure**

Add import at top of `FeaturedItemCard.tsx`:

```typescript
import { DisplayFigure } from '@/shared/components/DisplayFigure';
```

- [ ] **Step 2: Replace specs rendering with DisplayFigure**

Replace the specs section (lines 115-128) — currently renders `headlineSmall` text for value and `labelSmall` for label — with `DisplayFigure`:

```typescript
        {specs.length > 0 && (
          <View style={styles.specs}>
            {specs.map((spec) => (
              <DisplayFigure
                key={spec.label}
                value={spec.value}
                note={spec.label}
                size={22}
              />
            ))}
          </View>
        )}
```

Remove the now-unused `specItem`, `specValue`, `specLabel` styles from `getStyles()`.

- [ ] **Step 3: Run tests**

Run: `npm run test -- --testPathPattern=FeaturedItemCard`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx
git commit -m "feat: use DisplayFigure in FeaturedItemCard specs"
```

---

### Task 7b: Integrate DisplayFigure into ItemDetail spec strip

**Files:**

- Modify: `src/features/inventory/components/ItemDetail/ItemDetail.tsx:206-222`

The spec requires DisplayFigure to replace the current plain-text spec rendering in ItemDetail.

- [ ] **Step 1: Import DisplayFigure**

Add import at top of `ItemDetail.tsx`:

```typescript
import { DisplayFigure } from '@/shared/components/DisplayFigure';
```

- [ ] **Step 2: Add a display-figure spec strip for key numeric specs**

Above the "Technical Specifications" section (line 205), add a new section for display-figure specs — condition/remaining fraction, quantity, usage km. These are the "numbers that are the part" per the design system. Render them using `DisplayFigure` inside a horizontal row with hairline top and bottom borders:

```typescript
      {/* Spec figures — display-figure treatment */}
      <View style={[styles.section, themed.sectionBorder]}>
        <View style={styles.figureStrip}>
          {item.category === ItemCategory.Consumable && item.remainingFraction !== undefined && (
            <DisplayFigure
              value={String(Math.round(item.remainingFraction * 100))}
              unit="%"
              note={t('detail.remainingLabel')}
              size={28}
            />
          )}
          {item.quantity > 1 && (
            <DisplayFigure
              value={`×${item.quantity}`}
              note={t('detail.quantityLabel')}
              size={28}
            />
          )}
          {item.usageKm !== undefined && (
            <DisplayFigure
              value={String(kmToDisplayUnit(item.usageKm, distanceUnit))}
              unit={distanceUnit}
              note={t('detail.usageLabel')}
              size={28}
            />
          )}
        </View>
      </View>
```

Add the `figureStrip` style:

```typescript
  figureStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
  },
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- --testPathPattern=ItemDetail`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/inventory/components/ItemDetail/ItemDetail.tsx
git commit -m "feat: use DisplayFigure in ItemDetail spec strip"
```

---

### Task 7c: Wire accent color into group affiliation chips and chat screen

**Files:**

- Modify: `src/features/inventory/components/ItemDetail/ItemDetail.tsx:96-105` (group chip)
- Modify: `app/(tabs)/messages/[id].tsx` (trust signal + group chip — new UI elements)

- [ ] **Step 1: Restyle group affiliation chip in ItemDetail**

In `src/features/inventory/components/ItemDetail/ItemDetail.tsx`, change the `ownerChip` (line 100) from `secondaryContainer` background to `accentTint`:

```typescript
          <Chip
            compact
            icon="account-group"
            style={[styles.ownerChip, { backgroundColor: theme.customColors.accentTint }]}
          >
            <Text variant="labelSmall" style={{ color: theme.customColors.accent }}>
              {ownerGroup.name}
            </Text>
          </Chip>
```

- [ ] **Step 2: Read the chat detail screen**

Read `app/(tabs)/messages/[id].tsx` fully to understand the current header structure before adding trust signal and group chip.

- [ ] **Step 3: Add trust signal to chat header**

In the chat header (below the user name), add a conditional trust signal line. This appears when the other user has community history. For now, stub the data as `0` with a `// TODO: derive from user profile query` comment — the trust signal will only render when the value is positive, so the stub is safe.

Add styles via `StyleSheet.create` and themed styles via `useThemedStyles`:

```typescript
// In StyleSheet.create:
  trustSignal: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },

// In useThemedStyles:
  trustSignalColor: { color: theme.customColors.accent },

// In JSX:
{otherUserBorrowCount > 0 && (
  <Text
    variant="labelSmall"
    style={[styles.trustSignal, themed.trustSignalColor]}
  >
    {t('chat.trustSignal', { count: otherUserBorrowCount })}
  </Text>
)}
```

Add the i18n key `messaging.chat.trustSignal` = `"Borrowed {{count}} times · always returned"` to `src/i18n/en/messages.json`.

- [ ] **Step 4: Add group affiliation chip to item context bar**

When the conversation's item belongs to a group, render an accent-colored chip. Derive `groupName` from the conversation's item data (read the screen to determine the exact field). If not available in current data model, stub with a `// TODO` and skip rendering.

Add styles via `StyleSheet.create` and themed styles:

```typescript
// In StyleSheet.create:
  groupChip: {
    paddingHorizontal: spacing.sm,
    height: 22,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
  },

// In useThemedStyles:
  groupChipBg: { backgroundColor: theme.customColors.accentTint },
  groupChipText: { color: theme.customColors.accent },

// In JSX:
{groupName && (
  <View style={[styles.groupChip, themed.groupChipBg]}>
    <Text variant="labelSmall" style={themed.groupChipText}>
      {groupName}
    </Text>
  </View>
)}
```

- [ ] **Step 5: Run tests**

Run: `npm run test -- --testPathPattern="(ItemDetail|messages)"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/inventory/components/ItemDetail/ItemDetail.tsx \
  app/\(tabs\)/messages/\[id\].tsx \
  src/i18n/en/messages.json
git commit -m "feat: wire accent color into group chips and chat trust signal"
```

---

## Phase 3: Layout Refinements

### Task 8: Update searchGridDimensions for asymmetric widths

**Files:**

- Modify: `src/features/search/utils/searchGridDimensions.ts`
- Modify: `src/features/search/utils/__tests__/searchGridDimensions.test.ts` (append new tests — preserve existing)

- [ ] **Step 1: Add tests for new dimension functions**

Modify the existing `src/features/search/utils/__tests__/searchGridDimensions.test.ts`. Replace the import line at the top to include the new functions (the existing import already has `getSearchResultGridCardWidth`, `getSearchResultGridImageHeight`, and `SEARCH_GRID_COLUMN_GAP` — extend it with the new exports):

```typescript
// Replace the existing import with:
import {
  getSearchResultGridCardWidth,
  getSearchResultGridImageHeight,
  getSearchResultGridWideCardWidth,
  getSearchResultGridNarrowCardWidth,
  getSearchResultGridHeroCardWidth,
  getSearchResultGridHeroImageHeight,
  SEARCH_GRID_COLUMN_GAP,
} from '../searchGridDimensions';

// Keep the existing `describe('searchGridDimensions', ...)` block unchanged.
// Add a new describe block after the existing one:
describe('asymmetric widths', () => {
  const windowWidth = 390; // iPhone 14 width

  it('wide + narrow + gap = content width', () => {
    const wide = getSearchResultGridWideCardWidth(windowWidth);
    const narrow = getSearchResultGridNarrowCardWidth(windowWidth);
    const contentWidth = windowWidth - 32; // spacing.base * 2
    expect(wide + narrow + SEARCH_GRID_COLUMN_GAP).toBeCloseTo(contentWidth, 0);
  });

  it('wide card is larger than narrow card', () => {
    const wide = getSearchResultGridWideCardWidth(windowWidth);
    const narrow = getSearchResultGridNarrowCardWidth(windowWidth);
    expect(wide).toBeGreaterThan(narrow);
  });

  it('hero card fills content width', () => {
    const hero = getSearchResultGridHeroCardWidth(windowWidth);
    const contentWidth = windowWidth - 32;
    expect(hero).toBeCloseTo(contentWidth, 0);
  });

  it('hero image uses 16:9 aspect ratio', () => {
    const hero = getSearchResultGridHeroCardWidth(windowWidth);
    const heroHeight = getSearchResultGridHeroImageHeight(hero);
    expect(heroHeight).toBeCloseTo(hero * (9 / 16), 0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --testPathPattern=searchGridDimensions`
Expected: FAIL — functions not exported

- [ ] **Step 3: Rewrite searchGridDimensions with new functions**

Replace the entire contents of `src/features/search/utils/searchGridDimensions.ts` (this refactors the existing `contentWidth` extraction into a helper function while preserving all existing exports):

```typescript
import { spacing } from '@/shared/theme';

/** Matches `COLUMN_GAP` between two columns in the search results grid. */
export const SEARCH_GRID_COLUMN_GAP = spacing.sm;

/** Content width after horizontal padding. */
function contentWidth(windowWidth: number): number {
  return windowWidth - spacing.base * 2;
}

/** Card width for the symmetric 2-column search results grid. */
export function getSearchResultGridCardWidth(windowWidth: number): number {
  return (contentWidth(windowWidth) - SEARCH_GRID_COLUMN_GAP) / 2;
}

export function getSearchResultGridImageHeight(cardWidth: number): number {
  return cardWidth * 0.75;
}

/** Wide card in a 1.6:1 asymmetric row. */
export function getSearchResultGridWideCardWidth(windowWidth: number): number {
  return (contentWidth(windowWidth) - SEARCH_GRID_COLUMN_GAP) * 0.615;
}

/** Narrow card in a 1.6:1 asymmetric row (remainder). */
export function getSearchResultGridNarrowCardWidth(windowWidth: number): number {
  return (
    contentWidth(windowWidth) -
    SEARCH_GRID_COLUMN_GAP -
    getSearchResultGridWideCardWidth(windowWidth)
  );
}

/** Full-width hero card. */
export function getSearchResultGridHeroCardWidth(windowWidth: number): number {
  return contentWidth(windowWidth);
}

/** Hero image height at 16:9 aspect ratio. */
export function getSearchResultGridHeroImageHeight(cardWidth: number): number {
  return cardWidth * (9 / 16);
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- --testPathPattern=searchGridDimensions`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/search/utils/searchGridDimensions.ts \
  src/features/search/utils/__tests__/searchGridDimensions.test.ts
git commit -m "feat: add asymmetric grid dimension calculations for search"
```

---

### Task 9: Add variant prop to SearchResultGridCard

**Files:**

- Modify: `src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx`

- [ ] **Step 1: Add variant prop and aspect ratio logic**

In `SearchResultGridCard.tsx`, add `variant` to props:

```typescript
type SearchResultGridCardVariant = 'hero' | 'wide' | 'narrow';

interface SearchResultGridCardProps {
  item: SearchResultItem;
  onPress?: (item: SearchResultItem) => void;
  variant?: SearchResultGridCardVariant;
  cardWidth?: number;
}
```

Update the component to accept `variant` and `cardWidth` props. When `cardWidth` is provided, use it instead of computing from `windowWidth`. Compute `imageHeight` based on variant:

```typescript
const IMAGE_ASPECT_RATIOS: Record<SearchResultGridCardVariant, number> = {
  hero: 9 / 16,
  wide: 0.75, // 4:3
  narrow: 1, // 1:1
};

// Inside the component:
const computedCardWidth = cardWidth ?? getSearchResultGridCardWidth(windowWidth);
const aspectRatio = variant ? IMAGE_ASPECT_RATIOS[variant] : 0.75;
const imageHeight = Math.round(computedCardWidth * aspectRatio);
```

- [ ] **Step 2: Run tests and update if needed**

Run: `npm run test -- --testPathPattern=SearchResultGridCard`

The `variant` prop is optional so existing tests should pass unchanged. If `SearchResultGridCard.test.tsx` has assertions that break due to earlier shadow removal (Task 2) not being caught, fix those too.

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx \
  src/features/search/components/SearchResultGridCard/__tests__/
git commit -m "feat: add variant prop to SearchResultGridCard for asymmetric grid"
```

---

### Task 10: Refactor search screen to asymmetric editorial grid

**Files:**

- Modify: `app/(tabs)/search/index.tsx`
- Create: `src/features/search/utils/groupSearchResultPairs.ts`
- Create: `src/features/search/utils/__tests__/groupSearchResultPairs.test.ts`

- [ ] **Step 1: Write pair-grouping utility test**

Create `src/features/search/utils/__tests__/groupSearchResultPairs.test.ts`:

```typescript
import { groupSearchResultPairs } from '../groupSearchResultPairs';

describe('groupSearchResultPairs', () => {
  it('groups items into alternating wide-narrow / narrow-wide pairs', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const pairs = groupSearchResultPairs(items);
    expect(pairs).toEqual([
      { type: 'wide-narrow', items: ['a', 'b'] },
      { type: 'narrow-wide', items: ['c', 'd'] },
      { type: 'wide-narrow', items: ['e'] },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(groupSearchResultPairs([])).toEqual([]);
  });

  it('handles single item', () => {
    const pairs = groupSearchResultPairs(['a']);
    expect(pairs).toEqual([{ type: 'wide-narrow', items: ['a'] }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --testPathPattern=groupSearchResultPairs`
Expected: FAIL

- [ ] **Step 3: Write pair-grouping utility**

Create `src/features/search/utils/groupSearchResultPairs.ts`:

```typescript
export type RowType = 'wide-narrow' | 'narrow-wide';

export interface SearchResultPair<T> {
  type: RowType;
  items: T[];
}

/**
 * Groups items into pairs for the asymmetric editorial grid.
 * Alternates between wide-narrow and narrow-wide row layouts.
 */
export function groupSearchResultPairs<T>(items: T[]): SearchResultPair<T>[] {
  const pairs: SearchResultPair<T>[] = [];
  const rowTypes: RowType[] = ['wide-narrow', 'narrow-wide'];

  for (let i = 0; i < items.length; i += 2) {
    pairs.push({
      type: rowTypes[(i / 2) % 2],
      items: items.slice(i, i + 2),
    });
  }

  return pairs;
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- --testPathPattern=groupSearchResultPairs`
Expected: PASS

- [ ] **Step 5: Refactor search screen FlatList**

In `app/(tabs)/search/index.tsx`:

1. Remove `numColumns={2}` and `columnWrapperStyle` from the FlatList
2. Import the new utilities:
   ```typescript
   import { groupSearchResultPairs } from '@/features/search/utils/groupSearchResultPairs';
   import {
     getSearchResultGridWideCardWidth,
     getSearchResultGridNarrowCardWidth,
     getSearchResultGridHeroCardWidth,
   } from '@/features/search/utils/searchGridDimensions';
   ```
3. Extract hero item (first result) and render it in `ListHeaderComponent` using `SearchResultGridCard` with `variant="hero"` and `cardWidth={heroCardWidth}`
4. Group remaining items with `groupSearchResultPairs()`
5. Render each pair as a `View` row with `flexDirection: 'row'` and gap `SEARCH_GRID_COLUMN_GAP`
6. For `wide-narrow` rows: first card gets `variant="wide"` + `cardWidth={wideWidth}`, second gets `variant="narrow"` + `cardWidth={narrowWidth}`
7. For `narrow-wide` rows: inverse

This is the largest single change. Read the full file before editing to understand the existing header, filter, and sort logic that must be preserved.

- [ ] **Step 6: Run tests**

Run: `npm run test -- --testPathPattern=search`
Expected: PASS

- [ ] **Step 7: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add app/\(tabs\)/search/index.tsx \
  src/features/search/utils/groupSearchResultPairs.ts \
  src/features/search/utils/__tests__/groupSearchResultPairs.test.ts
git commit -m "feat: asymmetric editorial grid for search results"
```

---

### Task 11: Inventory list — grouped rows with inset hairlines

**Files:**

- Modify: `app/(tabs)/inventory/index.tsx`

**Approach:** The spec says "remove vertical margin" from ItemCard. However, ItemCard is used outside inventory (e.g., search results). Instead of modifying ItemCard globally, override its margins from the inventory screen level. The grouped container + `CellRendererComponent` style override removes per-card margins within the inventory list only. This achieves the spec's visual goal (no gaps between grouped cards) without breaking other consumers.

- [ ] **Step 1: Read inventory screen**

Read `app/(tabs)/inventory/index.tsx` fully to understand the current FlatList setup, hero extraction, and existing `ListHeaderComponent`.

- [ ] **Step 2: Add ItemSeparatorComponent**

Define a separator component in `app/(tabs)/inventory/index.tsx`:

```typescript
// 80px = spacing.md (12) + thumbnail width (56) + spacing.md (12) — inset past thumbnail
const SEPARATOR_LEFT_INSET = 80;

const separatorStyles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SEPARATOR_LEFT_INSET,
  },
});

function ItemSeparator() {
  const theme = useTheme<AppTheme>();
  return (
    <View
      style={[
        separatorStyles.separator,
        { backgroundColor: theme.colors.outlineVariant },
      ]}
    />
  );
}
```

Pass `ItemSeparatorComponent={ItemSeparator}` to the inventory FlatList.

- [ ] **Step 3: Add grouped container around the item list**

Wrap the FlatList (below the hero card) in a `View` with:

- `backgroundColor: theme.customColors.surfaceContainerLowest`
- `borderRadius: borderRadius.md`
- `marginHorizontal: spacing.base`
- `overflow: 'hidden'`

The hero card (FeaturedItemCard) renders above this wrapper in `ListHeaderComponent`, outside the grouped container. The FlatList's `contentContainerStyle` should override per-card margins within the grouped list (e.g., `marginHorizontal: 0, marginVertical: 0` on each cell via `CellRendererComponent` or style override).

- [ ] **Step 4: Run tests**

Run: `npm run test -- --testPathPattern=inventory`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/inventory/index.tsx
git commit -m "refactor: grouped inventory list with inset hairline separators"
```

---

### Task 12: Add hairlines to chat screen

**Files:**

- Modify: `app/(tabs)/messages/[id].tsx`

- [ ] **Step 1: Read the chat detail screen**

Read `app/(tabs)/messages/[id].tsx` fully to understand the current header, item context bar, and composer structure.

- [ ] **Step 2: Add hairline below chat header**

Add `borderBottomWidth: StyleSheet.hairlineWidth` and `borderBottomColor: theme.colors.outlineVariant` to the chat header container style.

- [ ] **Step 3: Add hairline below item context bar**

If the item context bar exists, add the same hairline border to its bottom. If it doesn't exist yet, this will be part of the new UI elements.

- [ ] **Step 4: Add hairline top on composer**

Add `borderTopWidth: StyleSheet.hairlineWidth` and `borderTopColor: theme.colors.outlineVariant` to the composer container style.

- [ ] **Step 5: Run tests**

Run: `npm run test -- --testPathPattern=messages`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/messages/\[id\].tsx
git commit -m "refactor: add hairline dividers to chat screen"
```

---

### Task 13: Final validation and cleanup

- [ ] **Step 1: Run full validation**

Run: `npm run validate`
Expected: PASS (format + lint + type-check + test + build)

- [ ] **Step 2: Fix any failures**

If any step fails, fix the issue and re-run.

- [ ] **Step 3: Verify all tests pass**

Run: `npm run test`
Expected: All tests PASS

- [ ] **Step 4: Squash and prepare for PR**

From the worktree:

```bash
git rebase main
git reset --soft main
git commit -m "feat: design system alignment — accent tokens, no shadows, hairlines, DisplayFigure, asymmetric grid"
```
