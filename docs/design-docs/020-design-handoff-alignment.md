# 020 — Design handoff alignment

Implementation plan for closing the gap between the shipping app and the
Claude Design handoff bundle (`bike-bin-design-system/`, exported
2026-04-22). The bundle's mobile UI kit (`ui_kits/mobile/bb-screens.jsx`)
and Impeccable overrides are the source of truth.

The foundation tokens (palette, typography, spacing, hairlines, accent,
no-shadow rule) already match the handoff. What remains is screen-level
composition: mastheads, editorial layouts, display-figure spec strips,
softened community signals.

## Phase 1 — Login (this PR, complete)

Shipped on `feat/design-login-masthead`:

- New shared `SocketBBMark` SVG component (teal disc, rounded-hex socket
  cutout, BB monogram).
- Login masthead now leads with the mark, then a hairline rule, then the
  uppercase "BIKE BIN" wordmark, tagline, and a one-sentence description.
- `welcome.description` added to `auth.json`; tagline gets a terminal
  period to match the handoff voice.

## Phase 2 — Inventory & Search mastheads (next)

Goal: replace the top-of-screen Searchbar-first layout with stamped
editorial mastheads that match the handoff.

- New shared components:
  - `Stamp` — uppercase, tracked, 10–11px label (`bb-stamp` from the
    design CSS). Tones: ink / dim / accent.
  - `ScreenMasthead` — composes a small dim Stamp ("Your collection"),
    a `displayLarge` uppercase title ("INVENTORY"), and an optional
    counts row of inline Big-Shoulders figures + Stamps.
- Wire `ScreenMasthead` into `app/(tabs)/inventory/index.tsx` above the
  search row. Counts: total / mounted / listed (listed in accent).
- Wire `ScreenMasthead` into `app/(tabs)/search/index.tsx` with title
  "NEARBY", a location stamp ("Helsinki · within 5 km"), and a
  `map-marker-outline` glyph in tertiary blue.
- i18n: add `inventory.masthead.{eyebrow,counts.*}` and
  `search.masthead.{eyebrow,location}` keys.

## Phase 3 — Chat header softening

Goal: align the conversation screen header and item-context strip with
the handoff (`BBChatScreen`).

- Replace any `★ rating` treatment with a sentence-style subtitle:
  "Borrowed N times · always returned" rendered in `bodySmall` weight
  700 with `customColors.accent` colour.
- Add an item-context strip directly under the header (40px thumbnail,
  item name, "Borrow request · pending" stamp, status chip), separated
  from header and message list by hairlines. Use existing
  `customColors.surfaceContainerLow` background.
- Composer: hairline top, flat teal send button (already mostly
  aligned — verify and adjust).

## Tab bar — six tabs vs. handoff's five (intentional divergence)

The handoff `TabBar` ships five tabs (Inventory / Bikes / Search / Messages
/ Profile) with Groups reachable from inside Profile. The shipping app
keeps six (adds Groups as a top-level tab):

- Groups is a load-bearing workflow that users reach frequently —
  collapsing it into Profile would add a hop to every group action.
- Tab icons use the outlined MCI glyphs to match the handoff strokes:
  `home-outline`, `bicycle`, `magnify`, `account-group-outline`,
  `chat-outline`, `account-outline` at `iconSize.md` 24 px. (`bicycle`
  and `magnify` have no separate outline variant in MCI.)
- The Messages unread badge uses `customColors.accent` /
  `customColors.onAccent` — the one place the accent earns a top-level
  appearance in chrome (community seam rule).

Revisit only if user testing surfaces an overfull tab bar.

## Phase 4 — Editorial layouts (deferred, separate PRs)

Out of scope for the alignment series; tracked here so it isn't lost.

- Search asymmetric grid: hero result + 2:1 / 1:2 alternating rows
  instead of the uniform `SearchResultGridCard` wall. Likely needs a
  new `SearchResultHeroCard` plus a layout coordinator.
- Item detail spec strip: full-width display-figure row (`11-34T / 40%
/ 269g`) with vertical hairlines between figures, and a Service-record
  section with hairline-separated key/value rows.
- `FeaturedItemCard` restyle: drop any remaining card shadow, lean on
  surface step + hairline separation; add a "Recently added" accent
  stamp slot in the bottom-right of the hero image.

## Sequencing & branches

Each phase ships as its own worktree branched from `main`, single
squashed commit, separate PR — per `CLAUDE.md`. Phase 2 depends on the
new `Stamp` and `ScreenMasthead` components; Phase 3 is independent and
can run in parallel.

## References

- Handoff bundle: `/tmp/bike-bin-design/bike-bin-design-system/`
  (regenerable from the export URL provided 2026-04-22).
- Mobile UI kit reference: `bb-screens.jsx` in that bundle.
- Impeccable overrides: `bike-bin-design-system/project/.impeccable.md`
  (no decorative gradients, no glassmorphism, no generic card shadows,
  hairlines + surface steps for definition, display-figure for spec
  numerals, accent reserved for community seams).
