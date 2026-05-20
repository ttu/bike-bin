# Borrow

## Overview

Manages the borrow-request lifecycle between users. A requester can ask to borrow an item; the owner accepts (item becomes **reserved** for the requester), the owner marks it **picked up** at handoff (item becomes **loaned**), and finally the owner marks it **returned** (item back to **stored**). Either party can cancel at any time before pickup; the owner can decline a pending request outright.

Creating a borrow request also opens (or reuses) the per-item conversation, so the chat thread becomes the primary surface for coordinating the loan. The chat screen renders an inline `BorrowRequestActionsBanner` exposing the relevant action(s) for the current state and current user. The legacy `(tabs)/profile/borrow-requests` screen remains as a secondary index.

## Data Model

### borrow_requests table

| Column       | Type                       | Description                                                 |
| ------------ | -------------------------- | ----------------------------------------------------------- |
| id           | uuid (PK)                  | BorrowRequestId branded type                                |
| item_id      | uuid (FK → items)          | Requested item                                              |
| requester_id | uuid (FK → profiles)       | User requesting to borrow                                   |
| status       | borrow_request_status enum | pending, accepted, picked_up, rejected, returned, cancelled |
| message      | text                       | Optional message from requester                             |
| acted_by     | uuid (FK → profiles)       | For group-owned items: admin who last transitioned status   |
| owner_id     | uuid (FK → profiles)       | Snapshot of item owner at request creation (immutable)      |
| group_id     | uuid (FK → groups)         | Snapshot of item group at request creation (immutable)      |
| created_at   | timestamptz                | Request creation                                            |
| updated_at   | timestamptz                | Last status change                                          |

### Enum: borrow_request_status

`pending` → `accepted` → `picked_up` → `returned`
`pending` → `rejected` (owner)
`pending` → `cancelled` (requester)
`accepted` → `cancelled` (requester or owner — handoff fell through)

### Item-status side effects (server-side via `transition_borrow_request` RPC)

| Request transition | Item status change                                  |
| ------------------ | --------------------------------------------------- |
| `accepted`         | `stored → reserved`                                 |
| `picked_up`        | `reserved → loaned`                                 |
| `returned`         | `loaned → stored`                                   |
| `rejected`         | (no change)                                         |
| `cancelled`        | `reserved → stored` (when cancelling from accepted) |

## Architecture

```
src/features/borrow/
├── components/
│   ├── BorrowRequestCard/
│   │   └── BorrowRequestCard.tsx           # Card with status + actions on borrow-requests screen
│   └── BorrowRequestActionsBanner/
│       └── BorrowRequestActionsBanner.tsx  # Inline action banner rendered in chat screen
├── hooks/
│   ├── useBorrowRequests.ts                # Query incoming/outgoing/active requests
│   ├── useCreateBorrowRequest.ts           # Create request + open/reuse conversation
│   ├── useAcceptBorrowRequest.ts           # Accept → item reserved
│   ├── useMarkPickedUp.ts                  # Pickup → item loaned
│   ├── useMarkReturned.ts                  # Return → item stored
│   ├── useDeclineBorrowRequest.ts          # Decline pending request
│   ├── useCancelBorrowRequest.ts           # Cancel pending or accepted request
│   ├── useAcceptedBorrowRequestForItem.ts  # Accepted request id for an item
│   └── useActiveBorrowRequestForItem.ts    # Live request (pending|accepted|picked_up) for an item — drives chat banner
├── utils/
│   └── borrowWorkflow.ts                   # State-machine predicates for actions
├── types.ts                                 # BorrowRequestWithDetails (extended with joined data)
└── index.ts                                 # Public API
```

### Workflow guards (borrowWorkflow.ts)

Pure functions determining which actions are available:

| Guard                                         | Condition                                              |
| --------------------------------------------- | ------------------------------------------------------ |
| `canRequestBorrow(item, userId)`              | Item is stored + borrowable + user is not owner        |
| `canAcceptRequest(request, userId, ownerId)`  | Request is pending + user is owner                     |
| `canDeclineRequest(request, userId, ownerId)` | Request is pending + user is owner                     |
| `canCancelRequest(request, userId)`           | Request is pending or accepted + user is requester     |
| `canMarkPickedUp(request, item, userId)`      | Request is accepted + item is reserved + user is owner |
| `canMarkReturned(request, item, userId)`      | Request is picked_up + item is loaned + user is owner  |

`getRequestActions()` returns all available actions for a request given the current user.

### BorrowRequestWithDetails

Extends `BorrowRequest` with joined data: `itemName`, `itemStatus`, `itemOwnerId`, `itemAvailabilityTypes`, `requesterName`, `requesterAvatarUrl`, `ownerName`, `ownerAvatarUrl`.

## Screens & Navigation

| Route                                | Screen          | Purpose                                                                |
| ------------------------------------ | --------------- | ---------------------------------------------------------------------- |
| `(tabs)/messages/[id].tsx`           | Chat thread     | Primary surface; renders `BorrowRequestActionsBanner` for live request |
| `(tabs)/profile/borrow-requests.tsx` | Borrow Requests | Secondary index: incoming/outgoing/active tabs                         |

## Key Flows

### Requesting to Borrow

1. User views listing detail → taps "Request Borrow"
2. Confirmation dialog → `useCreateBorrowRequest` inserts request with status `pending` AND find-or-creates the per-item conversation in the same mutation.
3. On success, the requester is navigated to `/messages/[conversationId]`.
4. The item status does **not** change at this point (it stays `stored`); reservation happens on accept.

### Owner Accepts

1. Owner sees the inline banner in the chat (or the card in the borrow-requests screen) → taps "Accept".
2. `useAcceptBorrowRequest` calls the `transition_borrow_request` RPC, which sets the request to `accepted` and the item to `reserved` atomically.

### Owner Marks Picked Up (new)

1. At handoff, the owner taps "Mark Picked Up" inline in the chat (or in the borrow-requests "active" tab).
2. `useMarkPickedUp` calls the RPC, setting the request to `picked_up` and the item to `loaned`.

### Owner Declines

1. Owner taps "Decline" on a pending request.
2. `useDeclineBorrowRequest` sets the request to `rejected`. Item status is unaffected (it never left `stored`).

### Requester Cancels

1. Requester taps "Cancel Request" while the request is `pending` or `accepted`.
2. `useCancelBorrowRequest` sets the request to `cancelled`. If it was `accepted`, item rolls back to `stored`.

### Mark Returned

1. After pickup, the owner taps "Mark Returned" inline in the chat or from inventory item detail.
2. `useMarkReturned` calls the RPC, setting the request to `returned` and the item to `stored`.

## RLS & Security

Borrow requests are visible to the requester and the item owner. **UPDATE** is allowed by RLS when the user is the requester or owns the item (`borrow_requests_update`, migration 00030). **Valid status transitions** (who may move which state) are enforced server-side by the `borrow_requests_enforce_update_rules` trigger (rewritten in migration 00023 for the three-step lifecycle). The `transition_borrow_request` RPC (also updated in 00023) atomically applies the request transition and the derived item-status change. The items-table `enforce_item_no_edits_while_borrow_locked` trigger allows the `reserved → loaned` pickup step as a permitted carve-out. Details: [016-rls-security.md](016-rls-security.md).

## i18n

Namespace: `borrow`

Key areas: `tabs.*` (tab labels), `empty.*` (empty states per tab), `card.*` (request card labels, status — including new `picked_up`), `actions.*` (action button labels — including new `markPickedUp`), `banner.{status}.{role}` (chat-banner context lines), `confirm.*` (confirmation dialogs — including new `markPickedUp.*`), `success.*` / `error.*` (feedback messages — including new `pickupFailed`), `profileMenu.*` (menu entry with pending count).

## Current Status

- **Implemented:** Three-step lifecycle (request → accept (reserved) → pickup (loaned) → return); chat-first UX with inline action banner; per-item conversation auto-opened on request; legacy borrow-requests screen aligned with new state machine; seed data updated.
- **Working:** All state transitions with confirmation dialogs (where applicable) and success/error feedback; RLS + trigger enforcement of transitions and actor permissions.
- **Known gaps:** No borrow duration enforcement at the DB layer. No automated "pickup reminder" notifications. E2E happy-path spec not yet written.
