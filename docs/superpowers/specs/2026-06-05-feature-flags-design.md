# Feature Flags for Pre-Release Gating — Design

**Date:** 2026-06-05
**Branch:** `feat/feature-flags`
**Status:** Approved (design phase)

## Problem

The app has several incomplete feature surfaces that must be hidden before the
first public release, while remaining fully visible in development so work can
continue. We need a simple, low-risk mechanism to switch these surfaces off for
a production build without deleting code.

The surfaces to gate, as identified with the user:

- **Buy / Sell / Borrow** (the peer-to-peer exchange surface)
- **Messages**
- **Groups**

## Key Finding: Buy/Sell/Borrow are entangled with Messaging

Investigation of the codebase showed buy/sell/borrow cannot be cleanly separated
from messaging:

- The listing "Contact" action (`src/features/search/components/ListingDetail/sections/ListingActions.tsx`)
  opens a messaging conversation — it _is_ a message thread.
- "Request Borrow" (`useCreateBorrowRequest`) calls `resolveConversation` from
  `@/features/messaging`, so borrow creates a conversation.
- **Ratings/reviews** are keyed on `borrowRequestId` + `transactionType`
  (Borrow/Sell). With no transactions there is nothing to rate, so ratings is
  entirely downstream of the exchange surface.

Because these are inseparable, they collapse into a single **`marketplace`**
flag rather than separate buy/sell/borrow/messages flags. Groups is independent
and gets its own **`groups`** flag.

## Decisions (settled with user)

| Decision          | Choice                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Control mechanism | **Build-time env vars** (mirrors existing `src/shared/utils/env.ts`)                        |
| Number of flags   | **2** — `marketplace`, `groups`                                                             |
| Default state     | **OFF everywhere**; explicit opt-in only                                                    |
| Marketplace scope | Messages, buy/sell/borrow, exchange, borrow flows, ratings/reviews, profile borrow-requests |
| Groups scope      | Groups tab + group conversations                                                            |
| Notifications     | **Not flagged** — infrastructure (bell); simply shows fewer items                           |

## Architecture

### 1. Flag module — `src/shared/utils/featureFlags.ts`

Follows the existing `env.ts` convention: module-level constants derived from
`EXPO_PUBLIC_*` env vars, evaluated at import.

```ts
export const isMarketplaceEnabled = process.env.EXPO_PUBLIC_FEATURE_MARKETPLACE === 'true';
export const isGroupsEnabled = process.env.EXPO_PUBLIC_FEATURE_GROUPS === 'true';
```

- **Default OFF everywhere.** A flag is on only when its env var is exactly
  `'true'`. Anything else (unset, `'false'`, `'0'`) is off.
- No remote config, no runtime fetching, no loading states. Flipping a flag is a
  rebuild/redeploy — acceptable for "hide incomplete work before release".

### 2. Gating layers

Three layers, because Expo Router still registers route files even when a tab is
hidden, so hiding the tab alone is not enough.

1. **Tabs** — `app/(tabs)/_layout.tsx` conditionally renders the `Messages`
   (marketplace) and `Groups` (groups) `<Tabs.Screen>` entries.
2. **Route guards** — each gated route screen returns a `<Redirect>` to a safe
   tab (e.g. inventory) when its flag is off. This protects against deep links
   and back-stack navigation to a hidden route. Affected route groups:
   `app/(tabs)/messages/*`, `app/(tabs)/groups/*`, and
   `app/(tabs)/profile/borrow-requests.tsx`.
3. **Inline UI** — hide the affected widgets where the flagged surface bleeds
   into otherwise-shipping screens:
   - `ListingActions` — hide Contact / Request Borrow buttons (marketplace).
   - `AvailabilitySection` (item form) — show only `Private`; hide `Sellable`,
     `Donatable`, `Borrowable` chips (marketplace).
   - `ListingListedFor` + search filters — hide sale/borrow listing chips and
     filters (marketplace).
   - Profile menu (`app/(tabs)/profile/index.tsx`) — hide the **borrow-requests**
     menu item (marketplace).
   - Ratings/review surfaces (review cards on profiles, rating prompts)
     (marketplace).

A small shared helper component `FeatureGate` (or inline `if` guards) keeps the
JSX readable; exact form decided during implementation, favoring the simplest
thing that reads well in each call site.

### 3. Tests

- **Existing suite stays green:** `src/test/setup.ts` sets
  `process.env.EXPO_PUBLIC_FEATURE_MARKETPLACE = 'true'` and
  `EXPO_PUBLIC_FEATURE_GROUPS = 'true'`, so the test environment defaults both
  flags ON. ~dozens of existing tests render gated surfaces and must continue to
  pass unchanged.
- **Flag-off behavior:** new unit tests in `featureFlags.test.ts` use the
  established `jest.isolateModules` + env-override pattern (see `env.test.ts`) to
  assert each constant for `'true'` / `'false'` / unset.
- **Integration:** assert a representative tab (Messages, Groups) and a
  representative inline surface (e.g. `ListingActions` buttons) disappear when
  the flag is off, rendering the component within `isolateModules` after setting
  the env var.

### 4. Docs

- `docs/development.md` — document the two `EXPO_PUBLIC_FEATURE_*` env vars and
  the default-off behavior.
- `docs/architecture.md` — note the feature-flag gating layers.

## Out of Scope (YAGNI)

- Runtime / remote-config flags, per-user targeting, percentage rollouts.
- A general flag registry or admin UI.
- Flagging notifications, search, bikes, inventory, locations, profile basics —
  these are shipping.
- Deleting any gated code — it stays, just hidden.

## Risks

- **Missed surface:** a flagged feature could leak through an un-gated entry
  point. Mitigation: the inline-UI layer list above is derived from a grep of
  entry points; implementation includes a sweep for `messaging`, `borrow`,
  `exchange`, `ratings`, and group references reachable from shipping screens.
- **Redirect loops:** a route guard must redirect to an always-on tab. Mitigation:
  redirect target is inventory, which is never flagged.
