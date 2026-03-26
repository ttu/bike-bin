# Kinetic Curator Phase 2: component upgrades — design

## Goal

Upgrade **buttons, chips, and inputs** so shared interaction patterns match the Kinetic Curator system everywhere they appear.

## Architecture

Three parallel tracks:

1. **Primary CTA** — a shared gradient primary button replaces ad hoc “contained” primary buttons.
2. **Chips** — one visual language for filter/select chips (pill, unselected fill, selected fill).
3. **Soft inputs** — flat Paper text fields with container fill and underline treatment (“soft” fields).

## A. Gradient primary button

**Visual**

- Linear gradient along the brand greens (primary → primary container direction as spec’d), rounded corners, uppercase label using the label scale, on-primary text.
- Fixed height and horizontal padding aligned with existing contained buttons.
- **Disabled:** solid neutral surface, muted text (no gradient).
- **Loading:** spinner in on-primary color in place of the label.
- Light shadow under the button for depth.

**Behavior**

- Supports press, disabled, loading, optional style override, and accessibility label.
- Implemented with the stack’s gradient primitive and theme tokens (no hardcoded hex in components).

**Scope**

- Replace **contained** primary actions app-wide: auth, empty states, listing actions, borrow actions, forms, dialogs, etc.
- **Exception:** keep outlined secondary actions as Paper buttons where the design explicitly uses outline (e.g. a secondary action beside a gradient primary).

## B. Filter chip restyling

**Visual**

- Pill shape (full border radius).
- Unselected: secondary container background; selected: primary fill with on-primary label.
- No selected checkmark icon — color change is enough.

**Scope**

- Forms and sheets that use chips for categories, filters, availability, groups, etc.
- Listing and item detail chips for availability.
- Bike type and similar toggles.
- **Do not** restyle **status** chips that use semantic success/warning colors — those stay exception-colored.

## C. Soft input fields

**Paper TextInput**

- Switch from **outlined** to **flat** mode.
- Background: highest surface container tier.
- Unfocused underline: outlineVariant at low opacity; focused: primary.
- Rounded container via shared style; skip extra “glow” beyond focus color change to limit complexity.

**Custom TextInputs**

- Price filters, chat composer, and any non-Paper field get the same fill and border treatment for consistency.

**Search bar**

- Background moves to the same container tier as other fields; corner radius aligned with inputs.

## Testing

- Existing tests should remain green; update snapshots only where visuals are asserted.
- No new behavioral tests required if changes are purely visual.

## Out of scope for this phase

- Condition selector grid, glass navigation, asymmetric editorial layouts — see main Kinetic Curator roadmap.
