# Design System — Kinetic Curator

## Overview

The "Kinetic Curator" is the creative north star for Bike Bin's visual identity. It moves beyond utilitarian inventory app aesthetics, treating the cyclist's collection as a high-end editorial gallery. The system prioritizes intentional asymmetry, tonal depth, and precision — inspired by carbon fiber racing frames.

## Design Philosophy

### Core Principles

- **"No-Line" Rule** — standard 1px borders are prohibited for sectioning. Definition through background shifts, negative space, and surface hierarchy instead
- **Surface as Physical Layers** — UI treated as layers of fine paper or frosted glass
- **Breathing Room Over Borders** — spacing implies boundaries, not outlines
- **Light-Refraction Over Flat Fills** — glassmorphism for floating elements

### Aesthetic Goals

- Premium, editorial gallery feel
- Forward motion through high-contrast typography and overlapping surfaces
- Precision-engineered, not template-generated

## Color System

### Light Theme Palette

| Token                | Value     | Purpose                               |
| -------------------- | --------- | ------------------------------------- |
| primary              | `#006857` | Deep, vibrant green — signature color |
| onPrimary            | `#ffffff` | —                                     |
| primaryContainer     | `#00846e` | Gradient CTA target                   |
| onPrimaryContainer   | `#f4fffa` | —                                     |
| secondary            | `#486460` | Warm neutral green-gray               |
| secondaryContainer   | `#cae9e3` | Chip unselected state                 |
| tertiary             | `#385d8c` | Community features (blue)             |
| tertiaryContainer    | `#5276a7` | —                                     |
| background / surface | `#f7f9ff` | Slight cool tint                      |
| surfaceVariant       | `#dfe3e8` | —                                     |
| onSurface            | `#181c20` | Darker but never pure black           |
| outline              | `#6d7a75` | —                                     |
| outlineVariant       | `#bccac4` | Ghost borders                         |
| error                | `#ba1a1a` | —                                     |

### Surface Hierarchy

| Token                   | Value     | Use                |
| ----------------------- | --------- | ------------------ |
| surfaceContainerLowest  | `#ffffff` | Interactive cards  |
| surfaceContainerLow     | `#f1f4fa` | Secondary sections |
| surfaceContainer        | `#ebeef4` | Grouped content    |
| surfaceContainerHigh    | `#e5e8ee` | Elevated elements  |
| surfaceContainerHighest | `#dfe3e8` | Input field fills  |
| surfaceBright           | `#f7f9ff` | List highlights    |
| surfaceDim              | `#d7dae0` | Dimmed backgrounds |
| primaryFixedDim         | `#5ddbbe` | Input focus glow   |

### Semantic Colors

| Token            | Value     | Purpose             |
| ---------------- | --------- | ------------------- |
| success          | `#16A34A` | Positive states     |
| warning          | `#D97706` | Warning states      |
| warningContainer | —         | Warning backgrounds |

### Gradient Rules

- **Signature CTA:** Linear gradient from `primary` (#006857) to `primaryContainer` (#00846e) at 135°
- **Glassmorphism:** `surface` at 80% opacity with 20px backdrop-blur for floating navigation

## Typography

**Font family:** Manrope — modern sans-serif with geometric foundations and open apertures.

| MD3 Role         | Font Variant      | Weight |
| ---------------- | ----------------- | ------ |
| Display (L/M/S)  | Manrope-ExtraBold | 800    |
| Headline (L/M/S) | Manrope-Bold      | 700    |
| Title Large      | Manrope-Bold      | 700    |
| Title (M/S)      | Manrope-SemiBold  | 600    |
| Body (L/M/S)     | Manrope-Regular   | 400    |
| Label (L/M/S)    | Manrope-Bold      | 700    |

## Spacing & Layout Tokens

### Spacing Scale

| Token | Value |
| ----- | ----- |
| xs    | 4px   |
| sm    | 8px   |
| md    | 12px  |
| base  | 16px  |
| lg    | 24px  |
| xl    | 32px  |
| 2xl   | 48px  |

### Border Radius

| Token | Value  |
| ----- | ------ |
| sm    | 8px    |
| md    | 12px   |
| lg    | 16px   |
| full  | 9999px |

### Icon Sizes

| Token | Value |
| ----- | ----- |
| sm    | 20px  |
| md    | 24px  |
| lg    | 32px  |
| xl    | 48px  |

## Component Patterns

### Phase 2: Component Restyling

- **Gradient Primary Button** — `GradientButton` with 135° gradient from primary to primaryContainer
- **Filter Chips** — pill shape, secondaryContainer fill (unselected), primary fill (selected)
- **Soft Input Fields** — container fill with surfaceContainerHighest, underline accent

### Phase 3: Navigation & Layout (Planned)

- **Glassmorphism Tab Bar** — expo-blur, 80% opacity surface, 20px backdrop blur
- **Editorial Hero Sections** — inventory first item as hero card with asymmetric layout
- **Micro-Interactions** — press feedback, ambient shadows, entrance animations
- Requires: `expo-blur`, `react-native-reanimated`

## Implementation

### Source files

```
src/shared/theme/
├── theme.ts       # AppTheme definition, lightTheme, darkTheme, font config
├── spacing.ts     # spacing, borderRadius, iconSize tokens
└── index.ts       # Public API exports
```

### Theme type

```typescript
interface AppTheme extends MD3Theme {
  customColors: CustomColors;
}
```

Extends React Native Paper's MD3Theme with custom color slots for surface containers, semantic colors, and inverse tokens.

## Phase Implementation Status

### Phase 1: Foundation — Implemented

- Custom color palette with all MD3 + extended tokens
- Manrope typography across all MD3 roles
- Surface hierarchy (5 container levels)
- Spacing, border radius, icon size tokens
- Light and dark theme definitions

### Phase 2: Components — Partially Implemented

- GradientButton component — implemented
- Filter chip restyling — implemented
- Soft input fields — implemented

### Phase 3: Navigation & Layout — Planned

- Glassmorphism tab bar — designed, not yet implemented
- Editorial hero sections — designed, not yet implemented
- Micro-interactions — designed, not yet implemented
- Blocked on: `expo-blur` and `react-native-reanimated` dependencies

## Current Status

- **Implemented:** Full theme token system, Manrope typography, surface hierarchy, gradient buttons, custom color contract
- **Partially implemented:** Phase 2 component restyling (gradient button done, chips done, inputs done)
- **Planned:** Phase 3 navigation/layout enhancements (glassmorphism, editorial layouts, animations)
