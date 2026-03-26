# Availability-gated actions on item detail — feature design

## Problem

Item detail offered **mark sold / donated / returned** regardless of how the item was actually offered. A borrow-only listing should not invite donate/sell actions.

## Decision

Each **transaction action** is shown only when:

1. **Status** allows it (e.g. only certain states can move to sold, donated, loaned, returned).
2. **Availability types** on the item include the corresponding offer (sellable, donatable, borrowable as appropriate).

**Archive** and **delete** stay driven by **status and delete rules** only, not by availability types.

## Button matrix (product)

| Action        | Requires availability | Status gate                                                  |
| ------------- | --------------------- | ------------------------------------------------------------ |
| Mark sold     | Sellable              | Stored or mounted (not already in a terminal flow)           |
| Mark donated  | Donatable             | Stored or mounted                                            |
| Mark loaned   | Borrowable            | Stored or mounted                                            |
| Mark returned | Borrowable            | Loaned                                                       |
| Archive       | —                     | Not already archived                                         |
| Delete        | —                     | Allowed only when business rules say the item can be removed |

Exact status names follow the shared item model.

## “Mark loaned”

- Moves the item into the loaned state from stored/mounted **without** requiring an in-app borrow request, so informal or offline loans stay possible.
- Uses the same confirmation pattern as other destructive or state-changing actions.

## Out of scope

- Wiring this button to the formal borrow-request flow.
- Search or list cards (item detail only).

## Testing (intent)

- Matrix above: each button appears only with the right **availability + status** combination; loaned path confirmed when borrowable.
