# Design Handoff — Completion Plan

**Date:** 2026-04-22
**Status:** Draft — needs review
**Handoff bundle:** `bike-bin-design-system/` (export 2026-04-22, re-fetchable from the design URL)
**Reference screens:** `bike-bin-design-system/project/ui_kits/mobile/bb-screens.jsx` (`BBLoginScreen`, `BBInventoryScreen`, `BBSearchScreen`, `BBItemDetailScreen`, `BBChatScreen`)
**Voice:** `bike-bin-design-system/project/README.md` ("workshop-warm, tactile, honest")

## Why this plan exists

Two alignment passes have already shipped:

- Design system alignment pass — tokens, no shadows, hairlines, `DisplayFigure`,
  asymmetric search grid, accent on group chips. Merged as commit `9ca510d`.
- `docs/design-docs/020-design-handoff-alignment.md` Phase 1 — login masthead with Socket
  BB mark + wordmark. Merged as commit `e9e1ad6`.

What's still missing between the current app and `bb-screens.jsx` is **screen-level
composition**: stamped editorial mastheads, chat header redesign, a handful of restyled
surfaces, and a few smaller accent/layout details. This plan closes those gaps in
four sequenced worktrees.

---

## Gap audit — shipped vs. remaining

Verified against the handoff kit and the current `main`-merged codebase.

### Already aligned (keep as-is)

- Palette: `primary #006857`, warm paper surfaces, oxidized-orange `accent #b8572e`,
  tertiary blue `#385d8c`, all container steps.
- Typography: Big Shoulders Display (Black/ExtraBold/Bold) for `display*` / `headline*`,
  Manrope gradient for everything else.
- No gradients, no glass, no card shadows. Only the FAB keeps a primary-tinted shadow.
- `DisplayFigure` component + usage in `FeaturedItemCard` and `ItemDetail` spec strip.
- Asymmetric search grid (hero + alternating wide/narrow rows), group chip in accent.
- Login masthead — Socket BB mark, hairline, `BIKE BIN` wordmark, tagline + description,
  dark Apple + ghost Google CTAs, hairline "or" divider, Browse-without link.
- `SocketBBMark` shared SVG component; `assets/logo-mark.svg` + `assets/logo-lockup.svg`.

### Remaining gaps

Grouped by screen / concern. Each entry links to the concrete `bb-screens.jsx` element.

1. **Inventory masthead** (`BBInventoryScreen` lines 222–230) — small dim stamp eyebrow
   "Your collection", `displayLarge` uppercase title "INVENTORY", and a counts row of
   inline Big Shoulders figures beside stamps (`12 items · 3 mounted · 2 listed`, listed
   in accent). Currently the screen leads with a `Searchbar`.
2. **Search masthead** (`BBSearchScreen` lines 308–317) — stamp eyebrow "Listings near
   you", title "NEARBY", location row with `map-marker-outline` in tertiary blue plus
   "Helsinki · within 5 km". Currently the screen leads with the results grid header.
3. **Search field** (`BBSearchScreen` lines 320–326) — 44 px `paperHigh` fill, teal 2 px
   bottom-border accent, inline search + sliders icons. Current `Searchbar` uses MD3
   default styling.
4. **Inventory filter chips row** (`BBInventoryScreen` lines 233–237) — black ink fill
   when active, `paperHigh` when inactive, 28 px tall, 8 px radius. Verify current chips
   match; restyle if not.
5. **Inventory section stamp** (`BBInventoryScreen` lines 258–261) — `Drivetrain · 6`
   left, `Sort · recent` right, both as small uppercase tracked stamps. Not present.
6. **Chat header redesign** (`BBChatScreen` lines 506–521) — handoff ships a custom
   48 px row (back / 36 px avatar / name / soft accent trust-signal / more icon), not
   the MD3 `Appbar.Header` currently used in `app/(tabs)/messages/[id].tsx:311`. Today
   the subtitle shows the item name; handoff shows the trust-signal line "Borrowed
   {{count}} times · always returned" in `customColors.accent`, weight 700. The i18n
   key (`messaging.chat.trustSignal`) exists but no component consumes it. The more-
   icon in the handoff is `more-horizontal` / `dots-horizontal`, not `dots-vertical`.
7. **Chat item-context strip** (`BBChatScreen` lines 522–531) — handoff uses a tight
   one-line strip on `surfaceContainerLow` between hairlines: 40 px thumbnail, item
   name, dim stamp (`Borrow request · pending`), and a status chip. The current
   `ItemReferenceCard` is a taller MD3-style card with a CTA and different framing.
   Needs a slimmer variant or a replacement.
8. **Chat composer** (`BBChatScreen` lines 555–561) — plus button (paperHigh pill), pill
   input, primary send button. Verify flat styling + hairline top border.
   8a. **Chat message bubbles** (`BBChatScreen` lines 536–551 + `ChatBubble.tsx`) — current
   "other" bubble uses `theme.colors.surfaceVariant` (`#e0dbd4`); handoff uses the
   lighter `customColors.surfaceContainerHigh` / `paperHigh` (`#e4e0d9`). Own bubble + asymmetric corner radius already match. Verify + swap the background token.
   8b. **Messages tab screen — masthead + list styling** (`app/(tabs)/messages/index.tsx`)
   — today shows a plain `headlineMedium` "Messages" header over `ConversationCard`s
   with MD3 shadow/elevation. Handoff idiom for list screens is a `ScreenMasthead`
   (eyebrow "Your threads", title "MESSAGES") plus a grouped `surfaceContainerLowest`
   container with hairline-separated rows (same treatment as the inventory list
   landed in the prior pass).
   8c. **ConversationCard drops card framing** (`src/features/messaging/components/ConversationCard/ConversationCard.tsx:153–156`)
   — still has `shadowOffset/shadowOpacity/shadowRadius/elevation` and a `surface` fill
   that renders as a floating MD3 card. Handoff idiom is a hairline-separated list row
   on `surfaceContainerLowest`: no shadow, no per-row radius, rely on the grouped
   container above for the 12 px outer radius. Keep the 44 px avatar + unread dot.
   8d. **Unread indicators in messaging** — the conversation-row unread dot currently uses
   `theme.colors.primary` (teal). Handoff allows primary for the generic "unread dot"
   token, but since messaging is the flagship community seam (gap #17) and the tab
   badge is moving to accent, consider using `customColors.accent` for the row dot as
   well — inside the messaging feature only, not globally.
9. **Item detail title block** (`BBItemDetailScreen` lines 420–429) — stacked chip row
   (`Mounted / Drivetrain / ×2`), `displayLarge` uppercase title "SHIMANO 105 /
   CASSETTE", meta row with middle-dot separators (`Shimano · CS-R7000 · 2022`). Current
   detail uses body-weight title.
10. **Item detail service-record** (`BBItemDetailScreen` lines 443–461) — "Service
    record" stamp then hairline-separated key/value rows (Condition, Mounted on, Last
    service). Current layout uses DetailCard sections without this stamped rhythm.
11. **Item detail location block** (`BBItemDetailScreen` lines 464–470) — tertiary-blue
    `map-marker-outline`, area name in bold, dim stamp "Area-level · exact address shared
    on accept". Privacy framing needs to be visible.
12. **Item detail listing section** (`BBItemDetailScreen` lines 473–479) — "Listed for"
    stamp, then accent-tinted chips (`Borrow`, `Group · Kallio CC`). Currently styled as
    neutral chips.
13. **Stamp shared component** — small uppercase tracked label (10–11 px, `letterSpacing
0.6`, weight 700) with `ink / dim / accent` tones. Used by mastheads, section
    headers, chat strip, item-detail service-record. Not present; every consumer would
    repeat the same style.
14. **ScreenMasthead shared component** — eyebrow + displayLarge title + optional
    counts/meta row. Wraps the Stamp + inline display figures. Not present.
15. **Ratings in non-transaction contexts** — `ReviewCard` still renders ★ stars; the
    handoff says stars are only allowed on the transaction-complete prompt
    (`RatingPrompt`). Profile headers and chat headers must use sentence form instead.
16. **Logo lockup usage** — `logo-lockup.svg` exists but is unused. Handoff puts the
    lockup on headers/email signatures; identify at least one surface (onboarding,
    About/settings footer) where it belongs rather than shipping dead asset.
17. **Tab-bar navigation icons + badge** (`bb-screens.jsx` `TabBar` lines 136–165 +
    handoff README icon table) — the MCI names in `app/(tabs)/_layout.tsx` already
    match (`home`, `bicycle`, `magnify`, `account-group`, `chat`, `account`), but two
    things diverge: the Messages unread badge uses `theme.colors.primary` instead of
    `customColors.accent` (handoff treats messaging as a community seam — orange, not
    teal), and the current layout ships **six** tabs (Inventory, Bikes, Search, Groups,
    Messages, Profile) while the handoff specifies **five** with Groups living "behind"
    Profile rather than as a top-level tab.

---

## Sequenced worktrees

Each worktree is a single squashed commit + PR per `CLAUDE.md`. Phases are ordered so
shared components land first.

### Phase A — `feat/design-stamp-and-masthead` (shared components)

Introduces the two shared primitives every later phase depends on.

1. **`src/shared/components/Stamp/Stamp.tsx`** — `<Stamp tone="ink"|"dim"|"accent">`
   rendering uppercase, tracked, weight-700 label. Sizes default to 10 px; exposes
   optional `size` prop.
   - Tests: renders children, applies tone color from theme, defaults to `ink`.
2. **`src/shared/components/ScreenMasthead/ScreenMasthead.tsx`** — composes a dim Stamp
   eyebrow, a `Text variant="displayLarge"` uppercase title with tight `letterSpacing
-1.2` and `lineHeight 0.9`, and an optional `counts` slot that renders
   `{value, label, tone?}[]` as inline `value` (Big Shoulders 22 px weight 800) + Stamp
   pairs separated by `spacing.base`.
   - Tests: renders eyebrow/title/counts, accent tone applies to both figure and stamp.
3. **Barrel exports** in `src/shared/components/index.ts`.
4. **i18n** — no new keys in this phase.

**Exit criteria:** Stamp + ScreenMasthead used nowhere yet, full test + type check pass.

### Phase B — `feat/design-inventory-search-mastheads`

Wires the new primitives into the two main list screens.

1. **`app/(tabs)/inventory/index.tsx`**
   - Replace the current top-of-screen block with `<ScreenMasthead eyebrow={t('inventory.masthead.eyebrow')} title={t('inventory.masthead.title')} counts={…}>`.
   - Counts: `{value: total, label: t('inventory.masthead.counts.items')}`,
     `{value: mounted, label: t('inventory.masthead.counts.mounted')}`,
     `{value: listed, label: t('inventory.masthead.counts.listed'), tone: 'accent'}`.
   - Keep the existing Searchbar + filter chips below, unchanged on data wiring but
     restyled for the chip palette (Step 3 below).
2. **`app/(tabs)/search/index.tsx`**
   - Replace current header with `<ScreenMasthead eyebrow={t('search.masthead.eyebrow')} title={t('search.masthead.title')}>` followed by a location row —
     `map-marker-outline` in `theme.colors.tertiary`, area name + radius from current
     location state, middle-dot separator.
   - Restyle the search field: `paperHigh` fill, 44 px height, 12 px radius, 2 px bottom
     border in `theme.colors.primary`. Use a plain `View` + `TextInput` rather than MD3
     `Searchbar` to avoid underline + elevation conflicts.
3. **Inventory filter chips** — confirm tokens: active fill `theme.colors.onBackground`
   (black ink), text `onPrimary` / `surface`; inactive fill
   `customColors.surfaceContainerHigh`, text `onSurfaceVariant`. Height 28 px, radius
   `borderRadius.sm` (8 px).
4. **Inventory section stamp row** — above each sectioned list group, render
   `<Stamp>{t('inventory.section.title', { name, count })}</Stamp>` left, and
   `<Stamp tone="dim">{t('inventory.sort.recent')}</Stamp>` right, in a `space-between`
   row with `padding: 0 spacing.base spacing.sm`.
5. **i18n additions** (`src/i18n/en/inventory.json`, `search.json`):
   - `inventory.masthead.eyebrow = "Your collection"`
   - `inventory.masthead.title = "Inventory"` (renders uppercase via component)
   - `inventory.masthead.counts.items = "items"`
   - `inventory.masthead.counts.mounted = "mounted"`
   - `inventory.masthead.counts.listed = "listed"`
   - `inventory.sort.recent = "Sort · recent"`
   - `inventory.section.drivetrain = "Drivetrain · {{count}}"` (+ other categories)
   - `search.masthead.eyebrow = "Listings near you"`
   - `search.masthead.title = "Nearby"`
   - `search.masthead.radius = "within {{km}} km"`
6. **Tests** — update the two screens' tests (and any visual snapshots) for the new
   structure. `renderWithProviders` mounting + accessibility queries for masthead
   title/eyebrow/counts.

### Phase C — `feat/design-messaging-overhaul`

Applies the handoff to the full messaging feature — list screen, conversation detail,
bubbles, conversation rows.

1. **Chat header** (`app/(tabs)/messages/[id].tsx`)
   - Replace the current `Appbar.Header` with a custom 48 px header row: back button,
     avatar (initials), name (`titleMedium`), and — when `otherUserBorrowCount > 0` — a
     `trustSignal` subtitle rendered with `theme.customColors.accent`, weight 700,
     letterSpacing 0.2.
   - Data source: new query hook `useUserBorrowHistory(userId)` returning
     `{ borrowCount: number, completedOnTimeCount: number }`. If the data model doesn't
     yet expose this, stub the hook to return `0/0` with a `// TODO(design): wire to
borrow history when analytics available` and leave the conditional render — the UI
     is hidden until real data flows in.
   - Hairline bottom border (`StyleSheet.hairlineWidth`, `outlineVariant`).
2. **Item-context strip**
   - Below the hairline, render a `surfaceContainerLow` strip with 40 px thumbnail
     (`CachedListThumbnail`), item name (`bodyMedium` weight 700), dim stamp
     (`Borrow request · pending` / `Donation · accepted` / …), and the current status
     chip (existing amber/green/red tones).
   - Hairline below.
3. **Group chip**
   - When `item.ownerGroup` is set, append a second accent-tinted chip on the strip:
     `accentTint` bg, `accent` text, `Group · {{name}}` content.
4. **Composer** — verify `borderTop: StyleSheet.hairlineWidth` + flat pill input +
   primary send. If the existing composer already matches, skip the restyle; otherwise
   remove any elevation / neumorphic fill.
   4a. **ChatBubble background** (`src/features/messaging/components/ChatBubble/ChatBubble.tsx:32`)
   — swap the "other" bubble background from `theme.colors.surfaceVariant` to
   `theme.customColors.surfaceContainerHigh` to match the lighter handoff tone.
   Own bubble + asymmetric tail radii stay unchanged.
   4b. **MessagesScreen masthead + grouped list** (`app/(tabs)/messages/index.tsx`)
   — replace the plain `headlineMedium` title with
   `<ScreenMasthead eyebrow={t('messages.masthead.eyebrow')} title={t('messages.masthead.title')}>`.
   Wrap the `FlatList` in a `surfaceContainerLowest` container (`borderRadius.md`,
   `marginHorizontal: spacing.base`, `overflow: hidden`), drop the current per-card
   `gap: spacing.md`, and add `ItemSeparatorComponent` with the hairline + avatar-
   inset pattern already used by inventory (`SEPARATOR_LEFT_INSET = spacing.md * 2 + 44`).
   4c. **ConversationCard — flat row** (`src/features/messaging/components/ConversationCard/ConversationCard.tsx:153–156`)
   — remove `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`, and the
   per-row `borderRadius`. Fill becomes `customColors.surfaceContainerLowest` (the
   grouped container handles the outer radius). Keep the 44 px avatar, unread dot, name
   / timestamp / preview layout.
   4d. **Conversation unread dot → accent** — change `themedStyles.unreadDot.backgroundColor`
   from `theme.colors.primary` to `theme.customColors.accent` (messaging-scoped; the
   generic "unread dot" token elsewhere in the app stays primary). The border-color
   against background stays, so the dot remains legible on any container step.
5. **i18n** — confirm `messaging.chat.trustSignal = "Borrowed {{count}} times · always returned"` exists (it does). Add:
   - `messaging.chat.context.borrowPending = "Borrow request · pending"`
   - `messaging.chat.context.borrowAccepted = "Borrow · accepted"`
   - `messaging.chat.context.donationPending = "Donation · pending"`
   - `messaging.chat.context.groupAffiliation = "Group · {{name}}"`
   - `messaging.masthead.eyebrow = "Your threads"`
   - `messaging.masthead.title = "Messages"`
6. **Tests** — update `ConversationDetailScreen.test.tsx` for the new header + strip
   structure; snapshot or query-based assertions for the trust-signal conditional render
   (hidden when `borrowCount === 0`). Update `ConversationCard.test.tsx` and
   `MessagesScreen.test.tsx` for the shadow removal, grouped-list container, accent
   unread dot, and masthead structure.

### Phase D — `feat/design-item-detail-editorial`

Applies the handoff to the item detail screen.

1. **Title block** (`src/features/inventory/components/ItemDetail/ItemDetail.tsx`)
   - Move the status + category + quantity chips above the title.
   - Render the name as `Text variant="displayLarge"` with `textTransform: uppercase`,
     `letterSpacing: -1`, `lineHeight: 0.92`. Allow two-line wrap.
   - Meta row below the title: brand, model, year separated by a middle dot rendered as
     a `<Text>` in `outlineVariant` color.
2. **Service-record block**
   - `<Stamp>{t('item.detail.serviceRecord')}</Stamp>` heading.
   - Rows: `Condition`, `Mounted on`, `Last service` — each a `flexDirection: 'row'`
     with a 110 px dim label column + body-weight value, hairline separators between
     rows. Reuse existing `DetailCard` only if it can be stripped of its card framing;
     otherwise render directly.
3. **Location block**
   - `surfaceContainerLow` fill, 12 px radius, `map-marker-outline` icon in
     `theme.colors.tertiary`, bold area name, dim stamp
     `Area-level · exact address shared on accept`. Today the location row exists; this
     redesigns its framing + privacy copy.
4. **Listing block**
   - `<Stamp>{t('item.detail.listedFor')}</Stamp>`, then accent-tinted chips for each
     active listing type + group affiliation. The chips come from the existing listing
     data; only restyle is needed (`accentTint` bg, `accent` text, `borderRadius.sm`).
5. **CTA row**
   - Primary `GradientButton` (already flat) for the contextual action (`Request to
borrow` / `Send message` / `Mark as donated` depending on role). Secondary
     `IconButton` in outline style for share. Height 48 px, flex distribution 1 + fixed 48.
6. **i18n** —
   - `inventory.detail.serviceRecord = "Service record"`
   - `inventory.detail.listedFor = "Listed for"`
   - `inventory.detail.location.areaLevelPrivacy = "Area-level · exact address shared on accept"`
   - Brand/model/year separator string is not i18n — rendered inline.
7. **Tests** — expand `ItemDetail.test.tsx` for the stamped blocks + accent listing
   chips + uppercase title rendering.

### Phase E — `feat/design-ratings-softening` (small, can slot anywhere after B)

1. **`src/features/ratings/components/ReviewCard/ReviewCard.tsx`** — replace the 5 star
   row with the sentence form used by the handoff: `t('ratings.reviewSummary', { count, onTime })` ("Borrowed {{count}} times · {{onTime}} on time"), weight 700,
   `customColors.accent`. Keep a short review body underneath if present.
2. Retain ★ rendering only inside `RatingPrompt` (the transaction-complete prompt) per
   handoff rule.
3. **i18n** —
   - `ratings.reviewSummary = "Borrowed {{count}} times · {{onTime}} on time"`

### Phase G — `feat/design-tabbar-icons` (small, can slot anywhere after A)

Aligns the bottom tab bar with the handoff icon table + unread-badge accent.

1. **Icon audit** (`app/(tabs)/_layout.tsx`) — confirm every `MaterialCommunityIcons`
   `name` matches the handoff canonical mapping from
   `bike-bin-design-system/project/README.md`:

   | Tab       | MCI name        |
   | --------- | --------------- |
   | Inventory | `home`          |
   | Bikes     | `bicycle`       |
   | Search    | `magnify`       |
   | Groups    | `account-group` |
   | Messages  | `chat`          |
   | Profile   | `account`       |

   Current names already match — verify no drift (`home-outline`, `magnify-outline`,
   etc.) has snuck in, and that icon size stays at `iconSize.md` (24 px).

2. **Messages unread badge → accent** — change `tabBarBadgeStyle.backgroundColor` on
   the Messages tab from `theme.colors.primary` to `theme.customColors.accent`, and
   `color` to `theme.customColors.onAccent`. Messaging is a community seam; the badge
   is the one place the accent earns a top-level appearance in chrome.
3. **Five-tab vs. six-tab decision** — raise with the user before implementing. The
   handoff `TabBar` ships five tabs (Inventory / Bikes / Search / Messages / Profile)
   with Groups reachable from inside Profile. The app currently ships six. Options:
   - **Keep six tabs** — document the deviation in `docs/design-docs/020-...` and
     leave `_layout.tsx` unchanged after the badge recolor. No user-facing flow change.
   - **Collapse to five** — move Groups into Profile (list entry → `/groups` stack),
     delete the tab registration, update i18n `tabs.groups` → kept for the Profile list
     label. Touches routing + deep links.

   Default recommendation: **keep six tabs** for now (Groups is a load-bearing
   workflow that users reach frequently in the current app), accept the divergence from
   the handoff screenshot, and revisit only if user testing surfaces the overfull tab
   bar.

4. **Tests** — update `_layout.test.tsx` (if present) for the new badge color; otherwise
   a render test asserting `tabBarBadgeStyle.backgroundColor === theme.customColors.accent`.
5. **i18n** — no new keys.

### Phase F — `feat/design-lockup-usage` (small, optional, ship last)

1. Render `assets/logo-lockup.svg` on **one** surface that warrants full brand: the
   About / settings footer (`app/(tabs)/profile/*` or equivalent). This keeps the
   lockup asset in active use and gives the `BB/001` model-code its one breathing spot
   after the login trim.
2. No i18n.

---

## Cross-cutting validation

### Code-level checks (after each phase)

```shell
npm run format
npm run lint
npm run type-check
npm run test:unit
npm run validate:i18n
```

Before each PR: `npm run validate` (runs the full format + lint + type-check + test

- build chain).

### Visual verification — required gate on every phase

Code correctness ≠ design correctness. Every phase must ship with a **side-by-side
visual comparison** against the matching handoff reference before the PR is marked
ready. "Looks right to me" is not enough — the handoff screens are the source of truth,
the audit has to be explicit.

**Reference sources:**

- Interactive: `bike-bin-design-system/project/ui_kits/mobile/index.html` (open the
  bundle locally in a browser).
- Static reference screens: the five screens shown in the handoff image
  (`01 · AUTH + BRAND MASTHEAD` → `05 · ITEM-LINKED CONVERSATION`), plus the preview
  cards under `bike-bin-design-system/project/preview/` for token-level checks
  (colors, spacing, chips, inputs).

**Per-phase reference mapping:**

| Phase                            | Matching handoff screens                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| A — Stamp / ScreenMasthead       | `preview/type_display.html`, `preview/type_body.html` (token-level)                           |
| B — Inventory + Search mastheads | `02 · INVENTORY`, `03 · NEARBY`                                                               |
| C — Messaging overhaul           | `05 · ITEM-LINKED CONVERSATION` + list screen (derived from the system's hairline-list idiom) |
| D — Item detail editorial        | `04 · ITEM DETAIL`                                                                            |
| E — Ratings softening            | `preview/components_chips.html` + handoff voice rule ("community-warm, not marketplace")      |
| F — Logo lockup                  | `preview/brand_logo.html`                                                                     |
| G — Tab bar icons + badge        | `02 · INVENTORY` / `03 · NEARBY` tab strips                                                   |

**Capture recipe** (attach to every PR):

1. Run `npm run dev` in the worktree; open the web build at **mobile viewport width
   390 px** (Chrome DevTools "iPhone 14" preset) with the same light-mode paper
   background as the reference.
2. Capture each affected screen as PNG — name them `<phase>-<screen>-app.png`.
3. Grab the matching handoff screen from the reference image or
   `ui_kits/mobile/index.html` rendered at the same width — name
   `<phase>-<screen>-handoff.png`.
4. Post both in the PR body under a `## Visual check` heading, one screen per row, with
   a short checklist of what was verified (masthead type, color of accent elements,
   hairlines present, no stray shadow, etc.).
5. Also capture **dark mode** (`prefers-color-scheme: dark`) for at least one screen
   per phase — the handoff defines both, and regressions tend to hide there.

**Dimension targets (mechanical, not subjective):**

- Masthead title: `displayLarge` weight 900, `letterSpacing: -1.2`, line-height ≈ 0.9
  — inspect via DevTools on the web build.
- Hairlines: `StyleSheet.hairlineWidth` resolves to 0.5 px on web; verify no 1 px rules
  on sectioning.
- FAB: exactly one shadow in the app (primary-tinted on the FAB). Any other shadow on
  any card is a regression.
- Accent color `#b8572e` (light) / `#e89868` (dark) appears **only** on: Messages tab
  badge, `RECENTLY ADDED` stamp, inventory `listed` count, group chips, chat trust
  signal, conversation unread dot, `ReviewCard` sentence. Anywhere else = regression.
- Tab bar: `surfaceContainer` fill, hairline top, zero elevation.

**Reviewer guardrails** — when reviewing a phase PR:

1. Open `ui_kits/mobile/index.html` in one window, the app preview in another, at the
   same width. Flip between them for each touched screen.
2. If the PR doesn't include the two-column screenshot comparison, request changes —
   it's required, not optional.
3. Spot-check the dimension targets above in DevTools; don't rely on screenshots alone
   for numeric properties.

### Cross-phase sanity pass (before merging the last phase)

Once all phases are merged to `main`, run one consolidated pass: open every affected
screen back-to-back in the running app and in `ui_kits/mobile/index.html`, on both
mobile (390 px) and desktop (1440 px) widths, light + dark. File any surviving drift as
follow-up tickets — don't let "mostly matches" become the final state.

## Out of scope (tracked, not planned)

- Glassmorphism tab bar (Phase 3 ambition in the system doc — "planned, not shipped").
- Reanimated ambient shadows / micro-entrances.
- Bundled TTFs replacing Google Fonts for previews (the app already bundles via
  `expo-font`; the design bundle's web previews do not).
- Raster app-icon / splash regeneration aligned to the Socket BB mark — needs a
  separate export from the designer.

## References

- `bike-bin-design-system/README.md` — system voice and constraints.
- `bike-bin-design-system/project/ui_kits/mobile/bb-screens.jsx` — reference screens.
- `docs/design-docs/015-design-system.md` — prior "Kinetic Curator" north star.
- `docs/design-docs/020-design-handoff-alignment.md` — original phased alignment doc
  (Phase 1 complete, Phases 2–4 are superseded by this plan).
- Design system alignment pass (shipped tokens / hairlines / `DisplayFigure` /
  asymmetric-grid) — see commit `9ca510d`.
