# Design System Strategy: The Kinetic Curator

## 1. Overview & Creative North Star

The "Kinetic Curator" is the creative North Star for this design system. It moves beyond the utilitarian "grid of parts" common in inventory apps, instead treating the cyclist’s collection as a high-end editorial gallery.

This system prioritizes **intentional asymmetry** and **tonal depth** to create a feeling of forward motion. By utilizing high-contrast typography scales and overlapping surfaces, we break the "template" look. We favor breathing room over borders and light-refraction (glassmorphism) over flat fills, ensuring the app feels as precision-engineered as a carbon fiber racing frame.

---

## 2. Colors & Surface Philosophy

The palette is rooted in a vibrant, technical green (`primary: #006857`), balanced by a sophisticated range of cool grays.

### The "No-Line" Rule

Standard 1px borders are strictly prohibited for sectioning. Definition must be achieved through:

- **Background Shifts:** Placing a `surface-container-low` component against a `surface` background.
- **Negative Space:** Utilizing the Spacing Scale (specifically `spacing-8` and `spacing-12`) to imply boundaries.

### Surface Hierarchy & Nesting

Treat the UI as physical layers of fine paper or frosted glass.

- **Base Layer:** `surface` (#f7f9ff).
- **Secondary Sections:** `surface-container-low` (#f1f4fa).
- **Interactive Cards:** `surface-container-lowest` (#ffffff).
- **Nesting:** To highlight a specific inventory sub-item, place a `surface-container-highest` element inside a `surface-container` block. This creates depth through value contrast rather than artificial outlines.

### Glass & Gradient Rules

- **The Signature CTA:** Use a subtle linear gradient from `primary` (#006857) to `primary_container` (#00846e) at a 135° angle. This adds "soul" and a premium finish to main action buttons.
- **Glassmorphism:** For floating navigation bars or modal headers, use `surface` at 80% opacity with a `20px` backdrop-blur. This integrates the content with the background, preventing a "pasted on" appearance.

---

## 3. Typography

We use **Manrope**, a modern sans-serif with geometric foundations and open apertures, ensuring maximum legibility during high-vibration activities (like checking a part mid-ride).

- **Display (Large/Medium):** Reserved for hero stats (e.g., total bike value or mileage). These should feel authoritative and editorial.
- **Headline (Small/Medium):** Used for category titles. Use `on-surface` (#181c20) to maintain a professional, high-contrast anchor.
- **Title (Medium/Small):** For card headings and list items.
- **Body (Large/Medium):** The workhorse for descriptions and technical specs.
- **Labels:** Use `label-md` for metadata (Weight, Condition, Category) in `on-surface-variant` (#3d4945) to create a clear secondary hierarchy.

---

## 4. Elevation & Depth

Depth is a functional tool, not a decorative one.

### Tonal Layering

Instead of shadows, use the **Layering Principle**:

- A `surface-container-lowest` card sitting on a `surface-container-low` background creates a "soft lift." This is our primary method for list items.

### Ambient Shadows

When an element must float (e.g., the Floating Action Button), use a tinted shadow:

- **Value:** `0px 12px 24px`
- **Color:** `on-surface` at 6% opacity.
- **Rationale:** This mimics natural ambient light, making the UI feel light and airy.

### The "Ghost Border"

If accessibility requires a container boundary, use the `outline-variant` token at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Buttons & Chips

- **Primary Button:** Gradient fill (`primary` to `primary-container`), `rounded-md` (12px), and `label-md` uppercase text for a technical feel.
- **Filter Chips:** Use `secondary-container` (#cae9e3) for unselected states. On selection, transition to `primary` with `on-primary` text. Use `rounded-full` (9999px) for chips to contrast against the `md` (12px) rounding of cards.

### Inventory Cards & Lists

- **The Rule of No Dividers:** Strictly forbid divider lines between list items. Separate items using `spacing-3` (1rem) and subtle background shifts.
- **Anatomy:** Image (leading, `rounded-sm`), Title/Sub-header (stacked), and Status Badge (trailing, using `tertiary-container` for low-priority status like "Stored").

### Input Fields

- **Soft Inputs:** Use `surface-container-highest` as the background fill with a "Ghost Border."
- **Focus State:** Transition the border to 100% opacity `primary` and add a 4px soft glow using the `primary_fixed_dim` token.

---

## 6. Do's and Don'ts

### Do

- **DO** use asymmetric padding. For example, a hero header might have `spacing-12` on top but only `spacing-6` on the bottom to create an editorial "pull."
- **DO** use `tertiary` (#385d8c) for community-related features. It distinguishes "My Stuff" (Green) from "The Community" (Blue).
- **DO** utilize `surface-bright` for highlights within long scrolling lists to break monotony.

### Don't

- **DON'T** use pure black (#000000) for text. Always use `on-surface` (#181c20) to keep the "Airy" vibe.
- **DON'T** use `rounded-none`. Everything in the bicycle world has an ergonomic radius; the UI must reflect that.
- **DON'T** use standard Material Design drop shadows. If it looks like a default shadow, it’s too heavy.

### Accessibility Note

Ensure all text on `primary` or `tertiary` backgrounds meets WCAG AA standards by utilizing the provided `on-` color tokens (e.g., `on_primary: #ffffff`), which have been calibrated for this specific palette.
