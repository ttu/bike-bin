# Borrow

## Overview

Manages the borrow request lifecycle between users. A requester can ask to borrow an item; the owner can accept, decline, or the requester can cancel. Once accepted, the item is marked as loaned. The owner can later mark it as returned. Requests are organized into three tabs: incoming, outgoing, and active.

## Data Model

### borrow_requests table

| Column         | Type                       | Description                                      |
| -------------- | -------------------------- | ------------------------------------------------ |
| id             | uuid (PK)                  | BorrowRequestId branded type                     |
| item_id        | uuid (FK → items)          | Requested item                                   |
| requester_id   | uuid (FK → profiles)       | User requesting to borrow                        |
| status         | borrow_request_status enum | pending, accepted, rejected, returned, cancelled |
| message        | text                       | Optional message from requester                  |
| owner_response | text                       | Optional decline reason                          |
| created_at     | timestamptz                | Request creation                                 |
| updated_at     | timestamptz                | Last status change                               |

### Enum: borrow_request_status

`pending` → `accepted` → `returned`
`pending` → `rejected`
`pending` → `cancelled`

## Architecture

```
src/features/borrow/
├── components/
│   └── BorrowRequestCard/
│       └── BorrowRequestCard.tsx    # Request card with status + actions
├── hooks/
│   ├── useBorrowRequests.ts         # Query incoming/outgoing/active requests
│   ├── useCreateBorrowRequest.ts    # Create new request mutation
│   ├── useAcceptBorrowRequest.ts    # Accept request + set item loaned
│   ├── useDeclineBorrowRequest.ts   # Decline request
│   ├── useCancelBorrowRequest.ts    # Cancel own request
│   └── useMarkReturned.ts           # Mark item returned
├── utils/
│   └── borrowWorkflow.ts            # State machine guards for actions
├── types.ts                          # BorrowRequestWithDetails (extended with joined data)
└── index.ts                          # Public API
```

### Workflow guards (borrowWorkflow.ts)

Pure functions determining which actions are available:

| Guard                                         | Condition                                            |
| --------------------------------------------- | ---------------------------------------------------- |
| `canRequestBorrow(item, userId)`              | Item is stored + borrowable + user is not owner      |
| `canAcceptRequest(request, userId, ownerId)`  | Request is pending + user is owner                   |
| `canDeclineRequest(request, userId, ownerId)` | Request is pending + user is owner                   |
| `canCancelRequest(request, userId)`           | Request is pending + user is requester               |
| `canMarkReturned(request, item, userId)`      | Request is accepted + item is loaned + user is owner |

`getRequestActions()` returns all available actions for a request given the current user.

### BorrowRequestWithDetails

Extends `BorrowRequest` with joined data: `itemName`, `itemStatus`, `itemOwnerId`, `itemAvailabilityTypes`, `requesterName`, `requesterAvatarUrl`, `ownerName`, `ownerAvatarUrl`.

## Screens & Navigation

| Route                                | Screen          | Purpose                                   |
| ------------------------------------ | --------------- | ----------------------------------------- |
| `(tabs)/profile/borrow-requests.tsx` | Borrow Requests | Three-tab view (incoming/outgoing/active) |

Accessed from the profile menu.

## Key Flows

### Requesting to Borrow

1. User views listing detail → taps "Request Borrow"
2. Confirmation dialog → `useCreateBorrowRequest` inserts request with status "pending"
3. Owner receives notification

### Owner Accepts

1. Owner views incoming tab → taps "Accept"
2. Confirmation → `useAcceptBorrowRequest` sets request to "accepted", item status to "loaned"
3. Requester notified

### Owner Declines

1. Owner taps "Decline" → optionally provides reason
2. `useDeclineBorrowRequest` sets request to "rejected"

### Requester Cancels

1. Requester taps "Cancel Request" on pending request
2. `useCancelBorrowRequest` sets request to "cancelled"

### Mark Returned

1. Owner taps "Mark Returned" on active loan
2. `useMarkReturned` sets request to "returned", item status back to "stored"

## RLS & Security

Borrow requests are accessible to both the requester and the item owner. RLS policies ensure users can only see and act on requests they're involved in.

**Known limitation:** RLS UPDATE policies for borrow_requests state machine transitions need refinement (documented in RLS test findings).

## i18n

Namespace: `borrow`

Key areas: `tabs.*` (tab labels), `empty.*` (empty states per tab), `card.*` (request card labels, status), `actions.*` (action button labels), `confirm.*` (confirmation dialogs), `success.*` / `error.*` (feedback messages), `profileMenu.*` (menu entry with pending count).

## Current Status

- **Implemented:** Full request lifecycle (create, accept, decline, cancel, mark returned), three-tab view, workflow guards, request cards with joined details
- **Working:** All state transitions with confirmation dialogs and success/error feedback
- **Known gaps:** RLS UPDATE policies for state machine may need tightening; no borrow duration enforcement
