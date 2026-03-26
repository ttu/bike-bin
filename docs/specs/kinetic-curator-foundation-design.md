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

### New custom colors (theme contract)

Extend the app theme’s **custom color** contract so surfaces can be layered without hard lines: keep existing semantic slots (e.g. success, warning, warningContainer) and add **surface container** steps from lowest to highest, plus **surfaceBright** / **surfaceDim**, **primaryFixedDim** (focus/glow), and **inverse** surface/on-surface/primary for inverted regions. Concrete hex values are in the table below — they are the single source of truth for the light theme.

### Light custom color values

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

### App manifest

Set the native **primary color** to `#006857` so OS chrome and splash metadata match the new brand green.

---

## Layer 2: Manrope Typography

### Font installation

Bundle **Manrope** static files for weights 400, 500, 600, 700, and 800 (e.g. from Google Fonts) with the Expo font pipeline already configured for the project.

### Font loading

Load fonts at startup and **do not render** the main UI until fonts are ready; keep the splash screen visible until then.

### Paper configuration

Map **Manrope** across MD3 type scales via Paper’s font configuration:

- **displayLarge/Medium/Small** — Manrope-ExtraBold (800)
- **headlineLarge/Medium/Small** — Manrope-Bold (700)
- **titleLarge/Medium/Small** — Manrope-Bold (700) / SemiBold (600)
- **bodyLarge/Medium/Small** — Manrope-Regular (400)
- **labelLarge/Medium/Small** — Manrope-Bold (700), uppercase tracking for labels

Light and dark themes share the same **font** configuration.

---

## Layer 3: Surface philosophy and no-line rule

### Principle

Replace decorative borders and list dividers with **tonal layering**: different `surfaceContainer*` steps and spacing so hierarchy reads from color and air, not rules.

### Where to apply

- **Main tab bar:** drop the top hairline; keep a light ambient shadow; bar fill stays on the main surface color.
- **Messages — conversation list:** separate rows with vertical spacing instead of dividers; list background vs card background use adjacent container tiers.
- **Messages — thread:** composer area sits on a higher container tier than the transcript; remove decorative top border on the composer.
- **Item detail and listing detail:** remove section dividers and row underlines; use large vertical spacing between sections and medium gaps between label/value rows.
- **Group detail:** same section spacing idea, no redundant dividers.
- **Inventory cards:** card on `surfaceContainerLowest`, list on `surfaceContainerLow` or base surface; no ornamental borders on cards.
- **Borrow requests tabs:** **keep** a clear active-tab indicator (functional); soften the tab bar’s decorative bottom edge with outlineVariant at low opacity.

### Ghost borders

When a visible edge is still required (inputs, focusable cards), use **outlineVariant** at about **15% opacity** and minimal width so the edge reads as subtle, not a hard rule.

### Rollout surfaces (by layer)

| Layer      | What changes                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| Theme      | Full MD3 palette + expanded custom surface/inverse tokens; manifest primary color                            |
| Typography | Manrope bundled and loaded at startup; Paper MD3 scales point at Manrope                                     |
| Surfaces   | Tab bar, messaging, inventory/search detail, cards, groups — dividers replaced by spacing and tonal surfaces |

---

## Out of Scope (Phase 2)

- Gradient CTA buttons
- Filter chip restyling (rounded-full, secondary-container fill)
- Soft input fields with ghost borders
- Condition selector grid
- Glassmorphism navigation bar
- Asymmetric editorial screen layouts
- Screen-level layout changes (hero headers, collection labels)
