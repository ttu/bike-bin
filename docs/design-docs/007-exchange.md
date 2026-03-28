# Exchange

## Overview

Handles donate and sell transactions. Currently a lightweight feature providing two mutations — `useMarkDonated` and `useMarkSold` — that transition an item's status to its terminal state. Transaction coordination happens through the messaging feature (conversations linked to items). Rating window creation after transactions is deferred to a future phase.

## Data Model

Exchange operates on existing tables:

- **`items`** — updates `status` to `donated` or `sold`
- **`conversations`** — transaction discussions happen in item-linked conversations (see messaging)

No dedicated exchange table exists. The `transaction_type` enum (`borrow`, `donate`, `sell`) exists in the schema for future use.

## Architecture

```
src/features/exchange/
├── hooks/
│   ├── useMarkDonated.ts    # Mutation: item status → donated
│   └── useMarkSold.ts       # Mutation: item status → sold
└── index.ts                  # Public API: useMarkDonated, useMarkSold
```

Minimal feature slice — two hooks that update item status and invalidate relevant query caches (items, search, conversations).

Both mutations accept an optional `recipientId` / `buyerId` parameter (not yet wired — for future rating window creation).

## Key Flows

### Mark as Donated

1. Owner taps "Mark as Donated" on item detail (requires donatable availability)
2. Confirmation dialog → `useMarkDonated` sets status to "donated"
3. Item moves to terminal state, hidden from inventory list by default

### Mark as Sold

1. Owner taps "Mark as Sold" on item detail (requires sellable availability)
2. Confirmation dialog → `useMarkSold` sets status to "sold"
3. Item moves to terminal state

## i18n

Namespace: `exchange`

Key areas: `confirm.*` (confirmation dialogs for donate/sell), `success.*` / `error.*` (feedback), `ownerActions.*` (button labels).

## Current Status

- **Implemented:** Mark donated, mark sold mutations with cache invalidation
- **Not yet implemented:** Rating window creation after transactions (deferred to ratings phase), buyer/recipient tracking, transaction history
