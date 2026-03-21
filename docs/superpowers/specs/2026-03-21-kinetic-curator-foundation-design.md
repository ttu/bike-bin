# Kinetic Curator Foundation — Design Spec

**Date:** 2026-03-21
**Scope:** Theme tokens, Manrope typography, surface philosophy (layers 1-3)
**Status:** Approved

---

## Goal

Transform the app's visual identity from utilitarian MD3 defaults to the "Kinetic Curator" design system — a premium, editorial aesthetic inspired by precision-engineered cycling equipment. This spec covers the three foundation layers; component restyling, navigation glassmorphism, and screen layouts follow in a later phase.

---

## Layer 1: Theme & Color Tokens

### Light Theme Palette

| Token                | Current   | New     | Notes                       |
| -------------------- | --------- | ------- | --------------------------- |
| primary              | #0D9488   | #006857 | Deeper, richer green        |
| onPrimary            | #FFFFFF   | #FFFFFF | —                           |
| primaryContainer     | #CCFBF1   | #00846e | Gradient CTA target         |
| onPrimaryContainer   | (default) | #f4fffa | —                           |
| secondary            | #64748B   | #486460 | Warm neutral green-gray     |
| secondaryContainer   | (default) | #cae9e3 | Chip unselected state       |
| onSecondaryContainer | (default) | #4d6a66 | —                           |
| tertiary             | (none)    | #385d8c | Community features (blue)   |
| tertiaryContainer    | (none)    | #5276a7 | —                           |
| onTertiary           | (none)    | #ffffff | —                           |
| onTertiaryContainer  | (none)    | #fdfcff | —                           |
| background           | #FFFFFF   | #f7f9ff | Slight cool tint            |
| surface              | #F8FAFC   | #f7f9ff | Matches background          |
| surfaceVariant       | #F1F5F9   | #dfe3e8 | —                           |
| onSurface            | #1E293B   | #181c20 | Darker but never pure black |
| onSurfaceVariant     | #64748B   | #3d4945 | —                           |
| onBackground         | #0F172A   | #181c20 | —                           |
| outline              | #CBD5E1   | #6d7a75 | —                           |
| outlineVariant       | (default) | #bccac4 | Ghost borders               |
| error                | #DC2626   | #ba1a1a | —                           |
| errorContainer       | (default) | #ffdad6 | —                           |
| onError              | (default) | #ffffff | —                           |
| onErrorContainer     | (default) | #93000a | —                           |

### New Custom Colors (extend CustomColors interface)

```typescript
interface CustomColors {
  success: string;
  warning: string;
  warningContainer: string;
  // New tokens
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceBright: string;
  surfaceDim: string;
  primaryFixedDim: string; // focus glow color
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}
```

### Light Custom Color Values

| Token                   | Value   | Purpose            |
| ----------------------- | ------- | ------------------ |
| surfaceContainerLowest  | #ffffff | Interactive cards  |
| surfaceContainerLow     | #f1f4fa | Secondary sections |
| surfaceContainer        | #ebeef4 | Grouped content    |
| surfaceContainerHigh    | #e5e8ee | Elevated elements  |
| surfaceContainerHighest | #dfe3e8 | Input field fills  |
| surfaceBright           | #f7f9ff | List highlights    |
| surfaceDim              | #d7dae0 | Dimmed backgrounds |
| primaryFixedDim         | #5ddbbe | Input focus glow   |
| inverseSurface          | #2d3135 | —                  |
| inverseOnSurface        | #eef1f7 | —                  |
| inversePrimary          | #5ddbbe | —                  |

### Dark Theme Palette

Derived by inverting the surface hierarchy and using the Kinetic Curator's light-on-dark token mapping:

| Token                   | Value   |
| ----------------------- | ------- |
| primary                 | #5ddbbe |
| onPrimary               | #00382e |
| primaryContainer        | #005143 |
| onPrimaryContainer      | #7cf8da |
| secondary               | #aecdc7 |
| secondaryContainer      | #304c48 |
| tertiary                | #a4c9fe |
| tertiaryContainer       | #204876 |
| background              | #101418 |
| surface                 | #101418 |
| surfaceVariant          | #3d4945 |
| onSurface               | #e2e5eb |
| onSurfaceVariant        | #bccac4 |
| outline                 | #8a938e |
| outlineVariant          | #3d4945 |
| error                   | #ffb4ab |
| surfaceContainerLowest  | #0b0f12 |
| surfaceContainerLow     | #1a1e22 |
| surfaceContainer        | #1e2226 |
| surfaceContainerHigh    | #252a2e |
| surfaceContainerHighest | #303539 |
| surfaceBright           | #353a3f |
| surfaceDim              | #101418 |
| primaryFixedDim         | #3dbfa3 |
| inverseSurface          | #e2e5eb |
| inverseOnSurface        | #2d3135 |
| inversePrimary          | #006857 |

### app.json

Update `primaryColor` from `#0D9488` to `#006857`.

---

## Layer 2: Manrope Typography

### Font Installation

1. Download Manrope static font files (weights 400, 500, 600, 700, 800) from Google Fonts
2. Place in `assets/fonts/` as `Manrope-Regular.ttf`, `Manrope-Medium.ttf`, `Manrope-SemiBold.ttf`, `Manrope-Bold.ttf`, `Manrope-ExtraBold.ttf`
3. The `expo-font` plugin is already in `app.json`

### Font Loading

In `app/_layout.tsx`, load fonts with `useFonts` from `expo-font` and gate rendering on font readiness (with `expo-splash-screen`).

### Paper Configuration

Use `configureFonts()` from `react-native-paper` to map Manrope across all MD3 type scales:

- **displayLarge/Medium/Small** — Manrope-ExtraBold (800)
- **headlineLarge/Medium/Small** — Manrope-Bold (700)
- **titleLarge/Medium/Small** — Manrope-Bold (700) / SemiBold (600)
- **bodyLarge/Medium/Small** — Manrope-Regular (400)
- **labelLarge/Medium/Small** — Manrope-Bold (700), uppercase tracking for labels

Both `lightTheme` and `darkTheme` receive the same font configuration via the `fonts` property.

---

## Layer 3: Surface Philosophy & No-Line Rule

### Principle

Borders and divider lines are replaced with tonal layering. Definition comes from background color shifts and negative space, not lines.

### Specific Changes

#### Tab Bar (`app/(tabs)/_layout.tsx`)

- Remove `borderTopWidth: 1` and `borderTopColor`
- Keep ambient shadow (`shadowOpacity: 0.06`)
- Background remains `theme.colors.surface`

#### Messages List (`app/(tabs)/messages/index.tsx`)

- Remove `<Divider />` as `ItemSeparatorComponent`
- Add `spacing.md` (12dp) vertical gap between conversation cards
- Set card background to `surfaceContainerLowest` against `surfaceContainerLow` list background

#### Chat Input (`app/(tabs)/messages/[id].tsx`)

- Remove `borderTopWidth: StyleSheet.hairlineWidth`
- Set input container background to `surfaceContainerHigh` for tonal contrast against surface

#### Item Detail (`src/features/inventory/components/ItemDetail/`)

- Remove 3x `<Divider />` between sections
- Remove `borderBottomWidth` on detail rows
- Use `spacing.lg` (24dp) between sections
- Detail row separators become `spacing.md` gaps

#### Listing Detail (`src/features/search/components/ListingDetail/`)

- Same treatment as Item Detail: remove 3x `<Divider />` and `borderBottomWidth`
- Section spacing via `spacing.lg`

#### Group Detail (`app/(tabs)/profile/groups/[id].tsx`)

- Remove 2x `<Divider />` between sections
- Use spacing between sections

#### Item Card (`src/features/inventory/components/ItemCard/`)

- Set card background to `surfaceContainerLowest`
- Parent list background to `surfaceContainerLow` or `surface`
- Remove any border styling if present

#### Borrow Requests Tabs (`app/(tabs)/profile/borrow-requests.tsx`)

- **Keep** `borderBottomWidth` for active tab indicator — this is functional, not decorative
- Change tab bar bottom border to `outlineVariant` at reduced opacity

### Ghost Borders

When accessibility requires a visible container boundary (e.g., input fields, card outlines for screen readers), use:

```typescript
borderColor: theme.colors.outlineVariant,
borderWidth: 1,
opacity: 0.15,
```

---

## Files to Modify

| Layer      | File                                                             | Change                                     |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------ |
| Theme      | `src/shared/theme/theme.ts`                                      | Full palette update, expanded CustomColors |
| Theme      | `src/shared/theme/index.ts`                                      | Re-export new types                        |
| Theme      | `app.json`                                                       | Update primaryColor                        |
| Typography | `assets/fonts/*.ttf`                                             | Add Manrope font files                     |
| Typography | `app/_layout.tsx`                                                | Font loading + splash gate                 |
| Typography | `src/shared/theme/theme.ts`                                      | configureFonts() for Paper                 |
| Surface    | `app/(tabs)/_layout.tsx`                                         | Remove tab bar border                      |
| Surface    | `app/(tabs)/messages/index.tsx`                                  | Remove Divider, add spacing                |
| Surface    | `app/(tabs)/messages/[id].tsx`                                   | Remove chat input border                   |
| Surface    | `src/features/inventory/components/ItemDetail/ItemDetail.tsx`    | Remove dividers/borders                    |
| Surface    | `src/features/search/components/ListingDetail/ListingDetail.tsx` | Remove dividers/borders                    |
| Surface    | `src/features/inventory/components/ItemCard/ItemCard.tsx`        | Tonal card background                      |
| Surface    | `app/(tabs)/profile/groups/[id].tsx`                             | Remove dividers                            |

---

## Out of Scope (Phase 2)

- Gradient CTA buttons
- Filter chip restyling (rounded-full, secondary-container fill)
- Soft input fields with ghost borders
- Condition selector grid
- Glassmorphism navigation bar
- Asymmetric editorial screen layouts
- Screen-level layout changes (hero headers, collection labels)
