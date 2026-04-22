# Design System Alignment

**Date:** 2026-04-20
**Status:** Approved
**Source:** Claude Design handoff bundle (`bike-bin-design-system`)

## Context

A comprehensive design system was created in Claude Design, specifying the visual language for Bike Bin: "workshop-warm, tactile, honest." Prior sessions already implemented several foundational changes (typography, flat buttons, glassmorphism removal, colorWithAlpha utility, status chip alpha tints). This spec covers the remaining gaps to achieve full alignment.

## What Already Exists (No Changes Needed)

- Typography: Big Shoulders Display + Manrope with correct weight gradient
- Color tokens: primary teal `#006857`, all surface containers, semantic colors
- Spacing, borderRadius, iconSize tokens
- GradientButton refactored to flat solid fill
- Tab bar: opaque `surfaceContainer` fill with hairline top border
- `colorWithAlpha` utility for alpha tint patterns
- Status chips: 20% alpha tint backgrounds with solid text
- Featured hero card pattern on inventory screen
- Login screen: editorial layout with Socket BB mark direction

## Changes — Three Phases

### Phase 1: Foundation Tokens

#### 1a. Accent color family in theme.ts

Extend `CustomColors` interface with:

```typescript
accent: string; // '#b8572e' (light) / '#e89868' (dark)
accentContainer: string; // '#e6c1ad' / '#5a2a10'
onAccent: string; // '#ffffff' / '#2a0f00'
accentTint: string; // 'rgba(184,87,46,0.18)' / 'rgba(232,152,104,0.20)'
```

Usage rules (also add as comments in `theme.ts` next to the token definitions):

- **Only at community seams** — groups, lending acceptance, messaging warmth
- **Rare editorial emphasis** — "recently added" stamps, featured item highlights
- **Never on primary CTAs** — primary teal stays for all action buttons

#### 1b. Remove card shadows

Strip `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` from:

| Component            | File                                                                           | Current Shadow                 |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| ItemCard             | `src/features/inventory/components/ItemCard/ItemCard.tsx`                      | 0.04 opacity, elevation 1      |
| FeaturedItemCard     | `src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx`      | 0.08 opacity, elevation 2      |
| SearchResultGridCard | `src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx` | 0.04 opacity, elevation 1      |
| Tab bar              | `app/(tabs)/_layout.tsx`                                                       | upward -4 offset, 0.04 opacity |

Cards derive definition from surface-step contrast (`surfaceContainerLowest` on `background`). The FAB retains its primary-tinted shadow.

#### 1c. Logo SVG assets

Copy from design bundle to `assets/`:

- `logo-mark.svg` — Socket BB: teal disc + rounded-hex socket cutout (r=6) + BB monogram
- `logo-lockup.svg` — Socket BB + "BIKE BIN" wordmark + "WORKSHOP INVENTORY · BB/001" caption

Note: `react-native-svg` is already installed. SVGs can be imported directly or rendered inline via `Svg`/`Path`/`Circle` components.

### Phase 2: Component Patterns

#### 2a. Hairline borders on key surfaces

Add 0.5px `outlineVariant` dividers:

| Location              | Pattern                                                            |
| --------------------- | ------------------------------------------------------------------ |
| ItemDetail spec strip | Hairline top + bottom around the display-figure row                |
| ItemDetail sections   | Hairlines between condition/build/location/listing sections        |
| Chat header           | Hairline below header bar                                          |
| Chat item context     | Hairline below the item context bar                                |
| Chat composer         | Hairline top on the composer                                       |
| Inventory list        | Inset hairlines between ItemCards (80px left inset past thumbnail) |

Implementation: `borderBottomWidth: StyleSheet.hairlineWidth` with `borderBottomColor: theme.colors.outlineVariant`. React Native's `StyleSheet.hairlineWidth` maps to the thinnest visible line on each platform (~0.5px).

#### 2b. DisplayFigure component

New shared component: `src/shared/components/DisplayFigure/DisplayFigure.tsx`

```typescript
interface DisplayFigureProps {
  value: string; // "11-34", "40", "269"
  unit?: string; // "T", "%", "g", "km"
  note?: string; // "range", "wear", "weight"
  size?: number; // font size for value, default 32
}
```

Rendering (all values in React Native logical pixels):

- Value: `BigShoulders-ExtraBold` (fontWeight 800), `letterSpacing: -0.64` (for default 32px size), `lineHeight: Math.round(size * 0.95)` (computed from size prop, e.g. 30 for 32px). `fontVariantNumeric: 'tabular-nums'` is web-only progressive enhancement — omit on native or wrap in `Platform.select`.
- Unit: Manrope Bold (700), `Math.round(size * 0.22)` font size, uppercase, `letterSpacing: 0.4`
- Note: Manrope SemiBold (600), 11px, uppercase, `letterSpacing: 0.3`, `onSurfaceVariant` color

The `note` prop expects an already-translated string — consumers call `t()` before passing. DisplayFigure itself has no i18n dependency.

Consumers:

- `ItemDetail` spec strip — replaces current plain-text spec rendering
- `FeaturedItemCard` hero specs — replaces current specs row

#### 2c. Community accent at messaging seams

| Location                                | Current                        | New                                       | Status       |
| --------------------------------------- | ------------------------------ | ----------------------------------------- | ------------ |
| FeaturedItemCard "recently added" badge | `colorWithAlpha(primary, 0.9)` | `accent` bg + `onAccent` text             | Restyle only |
| Group affiliation chips (listings)      | Grey chip (surfaceVariant bg)  | `accentTint` bg + `accent` text           | Restyle only |
| Chat header trust signal                | Does not exist yet             | New element: `accent` color, 700 weight   | New UI       |
| Chat item context group chip            | Does not exist yet             | New chip: `accentTint` bg + `accent` text | New UI       |

**Note on chat screen:** The trust signal ("Borrowed 12 times · always returned") and group affiliation chip in the chat header do not currently exist in the codebase. These are **new UI elements** to be added to `app/(tabs)/messages/[id].tsx` (or its header component). The trust signal renders below the user's name in the chat app bar when the other user has community history. The group chip renders in the item context bar when the conversation originates from a group listing. Both are aspirational from the design system and should be implemented as part of this work.

File: `app/(tabs)/messages/[id].tsx` — add hairline dividers + trust signal + group chip

### Phase 3: Layout Refinements

#### 3a. Search screen — asymmetric editorial grid

Replace `FlatList numColumns={2}` with sectioned editorial layout:

**Hero result** (first/closest item):

- Full-width card, 16:9 image aspect ratio
- Listing type chip + group chip overlay on image
- Name + distance figure below

**Remaining results** in alternating asymmetric rows:

- **Wide-narrow** (1.6:1 ratio): left card 4:3 image, right card 1:1
- **Narrow-wide** (1:1.6 ratio): inverse

Implementation approach:

- Extract hero item from results (same pattern as inventory's `heroItem`)
- Render hero in `ListHeaderComponent`
- Drop `numColumns={2}` — render remaining items as manually grouped pairs in row `View`s
- Update `searchGridDimensions.ts`:
  - Keep `SEARCH_GRID_COLUMN_GAP` (8px)
  - Add `getSearchResultGridWideCardWidth(windowWidth)`: `(windowWidth - spacing.base * 2 - SEARCH_GRID_COLUMN_GAP) * 0.615` (~1.6 ratio)
  - Add `getSearchResultGridNarrowCardWidth(windowWidth)`: remainder after wide + gap
  - Hero card width: `windowWidth - spacing.base * 2` (full content width)
- `SearchResultGridCard` gains `variant: 'hero' | 'wide' | 'narrow'` prop:
  - `hero`: image aspect ratio 16:9, full-width, listing type + group chip overlays
  - `wide`: image aspect ratio 4:3 (`cardWidth * 0.75`)
  - `narrow`: image aspect ratio 1:1 (`cardWidth`)
  - Default (no variant): current behavior for backwards compatibility
- Pair grouping utility: a simple function that chunks the remaining items array into pairs, alternating `['wide-narrow', 'narrow-wide']` row types

#### 3b. Inventory list — grouped rows with inset hairlines

Change from separated floating cards to grouped list:

- Remove vertical margin between ItemCards
- Add `ItemSeparatorComponent` to FlatList: 0.5px hairline, left-inset 80px (past thumbnail)
- Wrap the item list in a `surfaceContainerLowest` container with `borderRadius.md`
- The hero card (FeaturedItemCard) stays separate above the grouped list

## Files Modified

| File                                                                                          | Change                                                          |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/shared/theme/theme.ts`                                                                   | Add accent tokens to CustomColors + both themes (with comments) |
| `src/features/inventory/components/ItemCard/ItemCard.tsx`                                     | Remove shadow, remove vertical margin                           |
| `src/features/inventory/components/FeaturedItemCard/FeaturedItemCard.tsx`                     | Remove shadow, use DisplayFigure, accent "recently added" badge |
| `src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx`                | Remove shadow, add variant prop                                 |
| `app/(tabs)/_layout.tsx`                                                                      | Remove tab bar shadow                                           |
| `app/(tabs)/inventory/index.tsx`                                                              | Add ItemSeparatorComponent, grouped list container              |
| `app/(tabs)/search/index.tsx`                                                                 | Asymmetric grid with hero extraction, drop numColumns           |
| `src/features/search/utils/searchGridDimensions.ts`                                           | Add wide/narrow/hero card width calculations                    |
| `src/features/inventory/components/ItemDetail/ItemDetail.tsx`                                 | Hairlines on spec strip + sections, use DisplayFigure           |
| `app/(tabs)/messages/[id].tsx`                                                                | Hairline dividers, trust signal, group chip                     |
| `src/features/inventory/components/ItemCard/__tests__/ItemCard.test.tsx`                      | Update for shadow removal                                       |
| `src/features/inventory/components/FeaturedItemCard/__tests__/FeaturedItemCard.test.tsx`      | Update for shadow removal + DisplayFigure + accent badge        |
| `src/features/search/components/SearchResultGridCard/__tests__/SearchResultGridCard.test.tsx` | Update for shadow removal + variant prop                        |

## New Files

| File                                                         | Purpose                       |
| ------------------------------------------------------------ | ----------------------------- |
| `src/shared/components/DisplayFigure/DisplayFigure.tsx`      | Spec number display component |
| `src/shared/components/DisplayFigure/DisplayFigure.test.tsx` | Tests                         |
| `src/shared/components/DisplayFigure/index.ts`               | Public API                    |
| `assets/logo-mark.svg`                                       | Socket BB mark                |
| `assets/logo-lockup.svg`                                     | Socket BB + wordmark lockup   |

## Testing Strategy

- Unit tests for `DisplayFigure` component (renders value/unit/note, respects size prop, computes lineHeight from size)
- Update `ItemCard.test.tsx` — verify shadow style properties are absent
- Update `FeaturedItemCard.test.tsx` — verify shadow removed, DisplayFigure used in specs, accent badge color
- Update `SearchResultGridCard.test.tsx` — verify shadow removed, variant prop controls image aspect ratio
- Test asymmetric grid pair-grouping utility (pure function, easy to unit test)
- Verify dark mode accent tokens render correctly
- Visual verification of hairline borders, asymmetric grid, accent colors
