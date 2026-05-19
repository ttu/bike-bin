# Borrow Conversation Thread Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "request to borrow" open a chat thread (like the Contact flow does), and add a three-step item lifecycle (accept → reserved → pickup → loaned → return).

**Architecture:** Adds a `picked_up` request status, shifts item-status changes one step later (accept now flips Stored→Reserved, pickup flips Reserved→Loaned). Creating a borrow request also find-or-creates the per-item conversation, then navigates the requester to `/messages/[id]`. Request actions (accept, decline, pickup, return, cancel) are surfaced inline as a banner in the chat screen so the conversation is the primary surface.

**Tech Stack:** Expo + React Native + TypeScript, Supabase (Postgres + RPC + RLS), TanStack Query, Expo Router, react-i18next, Jest, Playwright.

---

## Pre-flight

- [ ] **Bootstrap the worktree**

```bash
cd /Users/ttu/src/github/bike-bin/.worktrees/borrow-conversation
npm install
```

- [ ] **Verify env present**

```bash
ls .env.local
```

Expected: file exists (copied from primary clone during worktree creation).

- [ ] **Reset local Supabase to a known state**

```bash
npm run db:reset
```

Expected: migrations apply cleanly through `00012_functions_business.sql`.

---

## File Structure

**New files**
- `supabase/migrations/00040_borrow_picked_up.sql` — new request status + transition rules + RPC update
- `src/features/borrow/hooks/useMarkPickedUp.ts`
- `src/features/borrow/hooks/usePendingBorrowRequestForItem.ts`
- `src/features/borrow/hooks/__tests__/useMarkPickedUp.test.ts`
- `src/features/borrow/components/BorrowRequestActionsBanner/BorrowRequestActionsBanner.tsx`
- `src/features/borrow/components/BorrowRequestActionsBanner/BorrowRequestActionsBanner.test.tsx`
- `src/features/borrow/components/BorrowRequestActionsBanner/BorrowRequestActionsBanner.stories.tsx`
- `src/features/messaging/utils/resolveConversation.ts` — extracted find-or-create logic
- `src/features/messaging/utils/__tests__/resolveConversation.test.ts`
- `__tests__/rls/borrow-picked-up.rls.test.ts`

**Modified files**
- `src/shared/types/borrow.ts` (or wherever `BorrowRequestStatus` lives) — add `PickedUp`
- `src/features/borrow/hooks/useCreateBorrowRequest.ts` — drop item-status flip, add conversation creation, return `conversationId`
- `src/features/borrow/hooks/useAcceptBorrowRequest.ts` — `newItemStatus: Reserved`
- `src/features/borrow/utils/borrowWorkflow.ts` — add `canMarkPickedUp`, update `canMarkReturned`, extend `RequestAction` and `getRequestActions`
- `src/features/borrow/index.ts` — export new hooks/components/utils
- `src/features/borrow/components/BorrowRequestCard/BorrowRequestCard.tsx` — render pickup action
- `src/features/messaging/hooks/useCreateConversation.ts` — delegate to `resolveConversation`
- `src/features/search/hooks/useListingDetailActions.ts` — navigate to chat after request
- `app/(tabs)/messages/[id].tsx` — render `BorrowRequestActionsBanner`
- `src/features/messaging/components/ItemContextStrip/ItemContextStrip.tsx` — context copy for new `Reserved` meaning
- `src/shared/i18n/locales/en/borrow.json` (+ other locales) — pickup strings, updated reserved copy
- `src/shared/i18n/locales/en/messages.json` (+ other locales) — chat context strings if needed

**Tests touched**
- `src/features/borrow/hooks/__tests__/useBorrowMutations.test.ts`
- `src/features/borrow/utils/__tests__/borrowWorkflow.test.ts` (or create if absent)
- `src/features/search/hooks/__tests__/useListingDetailActions.test.tsx`
- `app/(tabs)/search/__tests__/ListingDetailScreen.test.tsx`
- `__tests__/rls/borrow-requests.rls.test.ts` (update existing if state-machine assertions live there)
- `e2e/borrow.spec.ts` (create if absent, otherwise extend)

---

## Task 1: Add `picked_up` request status enum value (DB)

**Files:**
- Create: `supabase/migrations/00040_borrow_picked_up.sql`
- Test: `__tests__/rls/borrow-picked-up.rls.test.ts`

- [ ] **Step 1: Write the failing RLS test for the new enum value**

Create `__tests__/rls/borrow-picked-up.rls.test.ts`:

```ts
import { describe, it, expect } from '@jest/globals';
import { createServiceClient } from './helpers/serviceClient';

describe('borrow_request_status enum', () => {
  it('includes picked_up', async () => {
    const svc = createServiceClient();
    const { data, error } = await svc.rpc('pg_typeof_enum_values', {
      enum_name: 'borrow_request_status',
    });
    // If you don't have that helper, query pg_enum directly via SQL:
    const { data: rows, error: e2 } = await svc
      .from('pg_enum')
      .select('enumlabel')
      .schema('pg_catalog' as never);
    expect(error ?? e2).toBeNull();
    const labels = (rows ?? []).map((r: { enumlabel: string }) => r.enumlabel);
    expect(labels).toContain('picked_up');
  });
});
```

If the helper above is unwieldy, use a raw SQL probe via `supabase.rpc('exec_sql', ...)` if available, or skip in favor of a higher-level transition test (see Task 4). The intent is: prove the enum has the value.

- [ ] **Step 2: Run test and verify it fails**

```bash
npm run test:rls -- borrow-picked-up
```

Expected: FAIL — enum doesn't have `picked_up` yet.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/00040_borrow_picked_up.sql`:

```sql
-- ============================================================
-- Borrow: add picked_up status + three-step lifecycle
-- ============================================================

-- 1. Add the new enum value. Must be committed before use in DDL.
ALTER TYPE borrow_request_status ADD VALUE IF NOT EXISTS 'picked_up' AFTER 'accepted';
```

Note: Postgres requires `ADD VALUE` to commit before the value is usable in subsequent statements *in the same transaction*. Split the trigger/RPC updates into Task 2 (a separate migration file) so we don't fight that.

- [ ] **Step 4: Run migrations and re-run the test**

```bash
npm run db:reset
npm run test:rls -- borrow-picked-up
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00040_borrow_picked_up.sql __tests__/rls/borrow-picked-up.rls.test.ts
git commit -m "feat: add picked_up borrow request status"
```

---

## Task 2: Update transition trigger + RPC for new state machine

**Files:**
- Create: `supabase/migrations/00041_borrow_state_machine.sql`
- Modify: assertions in `__tests__/rls/borrow-picked-up.rls.test.ts`

**Allowed transitions after this task:**

| From | To | Item status change | Actor |
|---|---|---|---|
| pending | accepted | stored → reserved | owner / group admin |
| pending | rejected | (none) | owner / group admin |
| pending | cancelled | (none) | requester |
| accepted | picked_up | reserved → loaned | owner / group admin |
| accepted | cancelled | reserved → stored | requester or owner/admin |
| picked_up | returned | loaned → stored | owner / group admin |

- [ ] **Step 1: Write failing test for each allowed and disallowed transition**

Extend `__tests__/rls/borrow-picked-up.rls.test.ts` with cases like:

```ts
it('accept transitions item stored -> reserved', async () => {
  // arrange: create item (stored), create pending request as requester
  // act: owner calls transition_borrow_request(id, 'accepted', 'reserved')
  // assert: request.status = accepted, item.status = reserved
});

it('picked_up transitions item reserved -> loaned', async () => { /* ... */ });

it('returned from picked_up sets item stored', async () => { /* ... */ });

it('rejects pending -> picked_up', async () => { /* ... */ });

it('rejects accepted -> returned (must go through picked_up)', async () => { /* ... */ });
```

Use the RLS test helpers already in `__tests__/rls/helpers/` (look at existing borrow tests for shape).

- [ ] **Step 2: Run tests, verify failures**

```bash
npm run test:rls -- borrow-picked-up
```

Expected: FAIL on new transitions.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/00041_borrow_state_machine.sql`:

```sql
-- ============================================================
-- Borrow: three-step lifecycle (accept -> reserved, pickup -> loaned, return -> stored)
-- ============================================================

-- Replace transition trigger function
CREATE OR REPLACE FUNCTION borrow_requests_enforce_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_item items%ROWTYPE;
  v_is_owner_or_admin boolean;
  status_pending    constant borrow_request_status := 'pending';
  status_accepted   constant borrow_request_status := 'accepted';
  status_picked_up  constant borrow_request_status := 'picked_up';
  status_rejected   constant borrow_request_status := 'rejected';
  status_returned   constant borrow_request_status := 'returned';
  status_cancelled  constant borrow_request_status := 'cancelled';
BEGIN
  IF OLD.item_id IS DISTINCT FROM NEW.item_id
     OR OLD.requester_id IS DISTINCT FROM NEW.requester_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change item_id or requester_id';
  END IF;

  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id
     OR OLD.group_id IS DISTINCT FROM NEW.group_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change ownership snapshot';
  END IF;

  IF OLD.status IN (status_rejected, status_returned, status_cancelled)
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'borrow_requests: cannot change status from terminal state %', OLD.status;
  END IF;

  IF OLD.acted_by IS DISTINCT FROM NEW.acted_by THEN
    NEW.acted_by := OLD.acted_by;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_item FROM items WHERE id = NEW.item_id;

  v_is_owner_or_admin :=
    (v_item.owner_id IS NOT NULL AND v_item.owner_id = (select auth.uid()))
    OR (v_item.group_id IS NOT NULL AND private.is_group_admin(v_item.group_id, (select auth.uid())));

  -- pending -> accepted | rejected: owner/admin
  IF OLD.status = status_pending AND NEW.status IN (status_accepted, status_rejected) THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may accept or reject';
    END IF;
    IF v_item.group_id IS NOT NULL THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  -- pending -> cancelled: requester
  IF OLD.status = status_pending AND NEW.status = status_cancelled THEN
    IF OLD.requester_id IS DISTINCT FROM (select auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel a pending request';
    END IF;
    RETURN NEW;
  END IF;

  -- accepted -> picked_up: owner/admin (the pickup is recorded by owner)
  IF OLD.status = status_accepted AND NEW.status = status_picked_up THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may mark picked up';
    END IF;
    IF v_item.group_id IS NOT NULL THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  -- accepted -> cancelled: requester or owner/admin (handoff fell through)
  IF OLD.status = status_accepted AND NEW.status = status_cancelled THEN
    IF (select auth.uid()) IS DISTINCT FROM OLD.requester_id AND NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only requester or owner may cancel an accepted request';
    END IF;
    IF v_item.group_id IS NOT NULL AND v_is_owner_or_admin THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  -- picked_up -> returned: owner/admin
  IF OLD.status = status_picked_up AND NEW.status = status_returned THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may mark returned';
    END IF;
    IF v_item.group_id IS NOT NULL THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'borrow_requests: invalid status transition from % to %', OLD.status, NEW.status;
END;
$$;

-- Replace RPC: map request status -> item status under new lifecycle
CREATE OR REPLACE FUNCTION transition_borrow_request(
  p_request_id UUID,
  p_new_request_status TEXT,
  p_new_item_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
  v_caller UUID := (select auth.uid());
  v_derived_item_status item_status;
BEGIN
  SELECT br.*, i.owner_id AS item_owner_id
  INTO v_request
  FROM borrow_requests br
  JOIN items i ON i.id = br.item_id
  WHERE br.id = p_request_id
    AND (br.requester_id = v_caller OR i.owner_id = v_caller)
  FOR UPDATE OF br, i;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrow request not found or not accessible' USING ERRCODE = '42501';
  END IF;

  v_derived_item_status := CASE p_new_request_status
    WHEN 'accepted'  THEN 'reserved'::item_status
    WHEN 'picked_up' THEN 'loaned'::item_status
    WHEN 'returned'  THEN 'stored'::item_status
    WHEN 'rejected'  THEN 'stored'::item_status
    WHEN 'cancelled' THEN 'stored'::item_status
    ELSE NULL
  END;

  IF v_derived_item_status IS NULL THEN
    RAISE EXCEPTION 'No item status mapping for request status %', p_new_request_status;
  END IF;

  IF p_new_item_status IS NOT NULL
     AND p_new_item_status <> v_derived_item_status::text THEN
    RAISE EXCEPTION 'p_new_item_status mismatch: caller sent ''%'' but server derived ''%''',
      p_new_item_status, v_derived_item_status::text;
  END IF;

  UPDATE borrow_requests
  SET status = p_new_request_status::borrow_request_status, updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  UPDATE items
  SET status = v_derived_item_status, updated_at = NOW()
  WHERE id = v_request.item_id;

  RETURN to_jsonb(v_request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_temp;

REVOKE ALL ON FUNCTION transition_borrow_request(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION transition_borrow_request(UUID, TEXT, TEXT) TO authenticated;
```

- [ ] **Step 4: Apply and re-run RLS tests**

```bash
npm run db:reset
npm run test:rls -- borrow
```

Expected: PASS for new transitions, FAIL/PASS for disallowed (expect them to be rejected).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00041_borrow_state_machine.sql __tests__/rls/
git commit -m "feat: three-step borrow lifecycle (accept→reserved→pickup→loaned→return)"
```

---

## Task 3: Add `BorrowRequestStatus.PickedUp` to TS types

**Files:**
- Modify: `src/shared/types/borrow.ts` (or wherever the enum lives — grep `BorrowRequestStatus` to locate)

- [ ] **Step 1: Locate the enum**

```bash
grep -rn "BorrowRequestStatus" src/shared/types/
```

- [ ] **Step 2: Add `PickedUp = 'picked_up'`** to the enum, keep ordering alongside `Accepted`.

- [ ] **Step 3: Run type-check**

```bash
npm run lint && npx tsc --noEmit
```

Expected: any exhaustive switch over `BorrowRequestStatus` now errors with "not all cases handled." Note each such location — they'll be fixed in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat: add BorrowRequestStatus.PickedUp"
```

---

## Task 4: Extract conversation find-or-create into a shared util

**Files:**
- Create: `src/features/messaging/utils/resolveConversation.ts`
- Create: `src/features/messaging/utils/__tests__/resolveConversation.test.ts`
- Modify: `src/features/messaging/hooks/useCreateConversation.ts`

**Why:** `useCreateBorrowRequest` needs the same logic but can't call a React Query hook from inside another mutation. Extract the supabase calls to a plain async util.

- [ ] **Step 1: Write the failing test**

`src/features/messaging/utils/__tests__/resolveConversation.test.ts`:

```ts
import { resolveConversation } from '../resolveConversation';
import { mockSupabase } from '@/shared/api/__mocks__/supabase';
// shape this after existing useCreateConversation.test (likely in the hook's test dir)

describe('resolveConversation', () => {
  it('returns existing conversation id when one exists for (item, user)', async () => {
    // arrange mockSupabase to return an existing conv with both participants
    const result = await resolveConversation({
      supabase: mockSupabase,
      itemId,
      selfId,
      otherUserId,
    });
    expect(result).toEqual({ conversationId: existingId, isExisting: true });
  });

  it('creates a new conversation when none exists', async () => {
    // arrange empty result for existing lookup
    const result = await resolveConversation({ supabase: mockSupabase, itemId, selfId, otherUserId });
    expect(result.isExisting).toBe(false);
    expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
  });

  it('uses group admins as participants when groupId is provided', async () => { /* ... */ });
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
npm test -- resolveConversation
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Extract the logic**

Create `src/features/messaging/utils/resolveConversation.ts` that exports:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUuidV4 } from '@/shared/utils/randomUuid';
import { GroupRole, type ConversationId, type ItemId, type UserId, type GroupId } from '@/shared/types';

export interface ResolveConversationArgs {
  supabase: SupabaseClient;
  itemId: ItemId;
  selfId: string;
  otherUserId?: UserId;
  groupId?: GroupId;
}

export interface ResolveConversationResult {
  conversationId: ConversationId;
  isExisting: boolean;
}

export async function resolveConversation(args: ResolveConversationArgs): Promise<ResolveConversationResult> {
  // Move the bodies of findExistingConversation, fetchGroupAdminIds,
  // resolveOtherParticipantIds, insertConversationAndParticipants here
  // — verbatim, with `supabase` passed in instead of imported.
}
```

Move the helpers (`fetchGroupAdminIds`, `participantIdsOf`, `matchesGroup`, `matchesUser`, `findExistingConversation`, `resolveOtherParticipantIds`, `insertConversationAndParticipants`) into the same file as private (non-exported) functions. Take care to keep the rollback behavior on partial insert.

- [ ] **Step 4: Update `useCreateConversation`**

Slim it down to:

```ts
import { resolveConversation } from '../utils/resolveConversation';
import { supabase } from '@/shared/api/supabase';
// ...

return useMutation({
  mutationFn: async ({ itemId, otherUserId, groupId }: CreateConversationParams) => {
    if (!user) throw new Error('Must be authenticated to create conversations');
    if (!otherUserId && !groupId) throw new Error('Either otherUserId or groupId must be provided');
    return resolveConversation({ supabase, itemId, selfId: user.id, otherUserId, groupId });
  },
  onSuccess: async () => { /* unchanged */ },
});
```

- [ ] **Step 5: Run all messaging tests**

```bash
npm test -- src/features/messaging
```

Expected: all green (existing `useCreateConversation` tests still pass).

- [ ] **Step 6: Commit**

```bash
git add src/features/messaging/
git commit -m "refactor: extract conversation find-or-create into shared util"
```

---

## Task 5: `useCreateBorrowRequest` opens a conversation, no longer reserves the item

**Files:**
- Modify: `src/features/borrow/hooks/useCreateBorrowRequest.ts`
- Modify: `src/features/borrow/hooks/__tests__/useBorrowMutations.test.ts`

- [ ] **Step 1: Update the test**

In `useBorrowMutations.test.ts`, add/modify:

```ts
it('creates a borrow request without changing item status', async () => {
  // arrange item with status Stored
  await createBorrowRequest({ itemId });
  // assert items.status is still Stored
});

it('returns a conversationId pointing at the (item, owner) conversation', async () => {
  const result = await createBorrowRequest({ itemId });
  expect(result.conversationId).toBeDefined();
});

it('reuses an existing conversation for the same (item, owner)', async () => { /* ... */ });
```

Remove any assertion that item status becomes `Reserved` on request creation.

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- useBorrowMutations
```

- [ ] **Step 3: Update the hook**

Rewrite `useCreateBorrowRequest.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { resolveConversation } from '@/features/messaging/utils/resolveConversation';
import { invalidateBorrowMutationCaches } from './invalidateBorrowMutationCaches';
import { CONVERSATIONS_QUERY_KEY } from '@/features/messaging/hooks/useConversations';
import type { ConversationId, GroupId, ItemId, UserId } from '@/shared/types';

interface CreateBorrowRequestParams {
  itemId: ItemId;
  ownerId?: UserId;
  groupId?: GroupId;
  message?: string;
}

interface CreateBorrowRequestResult {
  requestId: string;
  conversationId: ConversationId;
}

export function useCreateBorrowRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId, ownerId, groupId, message }: CreateBorrowRequestParams): Promise<CreateBorrowRequestResult> => {
      if (!user) throw new Error('Must be authenticated to create borrow requests');
      if (!ownerId && !groupId) throw new Error('Either ownerId or groupId must be provided');

      const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .insert({ item_id: itemId, requester_id: user.id, message: message?.trim() || null })
        .select()
        .single();
      if (reqError) throw reqError;

      const conv = await resolveConversation({
        supabase,
        itemId,
        selfId: user.id,
        otherUserId: ownerId,
        groupId,
      });

      return { requestId: request.id, conversationId: conv.conversationId };
    },
    onSuccess: async () => {
      await invalidateBorrowMutationCaches(queryClient);
      await queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_QUERY_KEY] });
    },
  });
}
```

Note: drop the `items.status = Reserved` update entirely. That now happens server-side on `accepted` via the new RPC mapping.

- [ ] **Step 4: Run all borrow tests**

```bash
npm test -- src/features/borrow
```

- [ ] **Step 5: Commit**

```bash
git add src/features/borrow/hooks/useCreateBorrowRequest.ts src/features/borrow/hooks/__tests__/
git commit -m "feat: borrow request opens a conversation, no longer reserves item"
```

---

## Task 6: Accept goes to Reserved

**Files:**
- Modify: `src/features/borrow/hooks/useAcceptBorrowRequest.ts`
- Modify: `src/features/borrow/hooks/__tests__/useBorrowMutations.test.ts`

- [ ] **Step 1: Update test expectation**

`Accept` should flip item `Stored → Reserved` (not `Loaned`). Update the assertion in `useBorrowMutations.test.ts`.

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- useBorrowMutations
```

- [ ] **Step 3: Update the hook**

```ts
// src/features/borrow/hooks/useAcceptBorrowRequest.ts
import { BorrowRequestStatus, ItemStatus } from '@/shared/types';
import { useBorrowTransition } from './useBorrowTransition';

export function useAcceptBorrowRequest() {
  return useBorrowTransition({
    newRequestStatus: BorrowRequestStatus.Accepted,
    newItemStatus: ItemStatus.Reserved,
  });
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- useBorrowMutations
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat: accept borrow request reserves the item"
```

---

## Task 7: `useMarkPickedUp`

**Files:**
- Create: `src/features/borrow/hooks/useMarkPickedUp.ts`
- Create: `src/features/borrow/hooks/__tests__/useMarkPickedUp.test.ts`
- Modify: `src/features/borrow/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
// useMarkPickedUp.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useMarkPickedUp } from '../useMarkPickedUp';
// Use the same harness as useBorrowMutations.test.ts

describe('useMarkPickedUp', () => {
  it('transitions accepted->picked_up and reserved->loaned', async () => { /* ... */ });
  it('errors when called by a non-owner', async () => { /* ... */ });
  it('errors when request is not in accepted state', async () => { /* ... */ });
});
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Write the hook**

```ts
import { BorrowRequestStatus, ItemStatus } from '@/shared/types';
import { useBorrowTransition } from './useBorrowTransition';

export function useMarkPickedUp() {
  return useBorrowTransition({
    newRequestStatus: BorrowRequestStatus.PickedUp,
    newItemStatus: ItemStatus.Loaned,
  });
}
```

- [ ] **Step 4: Export from `index.ts`**

```ts
export { useMarkPickedUp } from './hooks/useMarkPickedUp';
```

- [ ] **Step 5: Run, verify pass**

```bash
npm test -- useMarkPickedUp
```

- [ ] **Step 6: Commit**

```bash
git add src/features/borrow/
git commit -m "feat: useMarkPickedUp hook for handoff transition"
```

---

## Task 8: Update `borrowWorkflow` predicates + actions

**Files:**
- Modify: `src/features/borrow/utils/borrowWorkflow.ts`
- Create/Modify: `src/features/borrow/utils/__tests__/borrowWorkflow.test.ts`

- [ ] **Step 1: Write failing tests**

Cover every cell in the matrix:

```ts
describe('canMarkPickedUp', () => {
  it('true when request is accepted, item reserved, user is owner', () => { /* ... */ });
  it('false when request is pending', () => { /* ... */ });
  it('false when user is not owner', () => { /* ... */ });
});

describe('canMarkReturned', () => {
  it('true when request is picked_up, item loaned, user is owner', () => { /* ... */ });
  it('false when request is accepted but item still reserved', () => { /* ... */ });
});

describe('getRequestActions', () => {
  it('returns [accept, decline] for pending+owner', () => { /* ... */ });
  it('returns [cancel] for pending+requester', () => { /* ... */ });
  it('returns [markPickedUp, cancel] for accepted+owner', () => { /* ... */ });
  it('returns [cancel] for accepted+requester', () => { /* ... */ });
  it('returns [markReturned] for picked_up+owner', () => { /* ... */ });
  it('returns [] for picked_up+requester', () => { /* ... */ });
});
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Update `borrowWorkflow.ts`**

```ts
export type RequestAction = 'accept' | 'decline' | 'cancel' | 'markPickedUp' | 'markReturned';

export function canMarkPickedUp(
  request: RequestInfo,
  item: Pick<Item, 'status' | 'ownerId'>,
  userId: UserId,
): boolean {
  return (
    request.status === BorrowRequestStatus.Accepted &&
    item.status === ItemStatus.Reserved &&
    item.ownerId === userId
  );
}

export function canMarkReturned(
  request: RequestInfo,
  item: ReturnableItem,
  userId: UserId,
): boolean {
  return (
    request.status === BorrowRequestStatus.PickedUp &&
    item.status === ItemStatus.Loaned &&
    item.ownerId === userId
  );
}

// canCancelRequest: extend to include accepted state
export function canCancelRequest(request: RequestInfo, userId: UserId): boolean {
  return (
    (request.status === BorrowRequestStatus.Pending ||
      request.status === BorrowRequestStatus.Accepted) &&
    request.requesterId === userId
  );
}

export function getRequestActions(
  request: RequestInfo,
  userId: UserId,
  itemOwnerId: UserId,
  item?: Pick<Item, 'status' | 'ownerId'>,
): RequestAction[] {
  const actions: RequestAction[] = [];
  if (canAcceptRequest(request, userId, itemOwnerId)) actions.push('accept');
  if (canDeclineRequest(request, userId, itemOwnerId)) actions.push('decline');
  if (canCancelRequest(request, userId)) actions.push('cancel');
  if (item && canMarkPickedUp(request, item, userId)) actions.push('markPickedUp');
  if (item && canMarkReturned(request, item, userId)) actions.push('markReturned');
  return actions;
}
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat: borrowWorkflow supports pickup and accepted-cancel"
```

---

## Task 9: Listing detail navigates to chat after request

**Files:**
- Modify: `src/features/search/hooks/useListingDetailActions.ts`
- Modify: `src/features/search/hooks/__tests__/useListingDetailActions.test.tsx`
- Modify: `app/(tabs)/search/__tests__/ListingDetailScreen.test.tsx`

- [ ] **Step 1: Update test**

In `useListingDetailActions.test.tsx`:

```ts
it('navigates to the new conversation after a successful borrow request', async () => {
  // arrange createBorrowRequest mock to resolve { requestId, conversationId }
  await act(handleRequestBorrow);
  expect(router.push).toHaveBeenCalledWith(`/messages/${conversationId}`);
});
```

Remove the existing assertion that we navigate to `/(tabs)/profile/borrow-requests`.

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Wire it up**

In `useListingDetailActions.ts` (line ~72):

```ts
const handleRequestBorrow = useCallback(() => {
  const params = resolveContactParams(item);
  if (!params) return;
  const { errorMessage, ...dialog } = requestBorrowDialog;
  openConfirm({
    ...dialog,
    onConfirm: () => {
      closeConfirm();
      createBorrowRequest(
        {
          itemId: item.id,
          ownerId: 'otherUserId' in params ? params.otherUserId : undefined,
          groupId: 'groupId' in params ? params.groupId : undefined,
        },
        {
          onSuccess: ({ conversationId }) => router.push(`/messages/${conversationId}`),
          onError: () =>
            showSnackbarAlert({ message: errorMessage, variant: 'error', duration: 'long' }),
        },
      );
    },
  });
}, [/* updated deps */]);
```

- [ ] **Step 4: Run all search tests**

```bash
npm test -- src/features/search app/\(tabs\)/search
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat: borrow request navigates to chat thread"
```

---

## Task 10: `usePendingBorrowRequestForItem`

**Files:**
- Create: `src/features/borrow/hooks/usePendingBorrowRequestForItem.ts`
- Create: test next to it
- Modify: `src/features/borrow/index.ts`

Mirror `useAcceptedBorrowRequestForItem` but filter for *active* requests (`Pending`, `Accepted`, or `PickedUp` — anything not terminal). The banner needs a single source of truth: "what's the live request for this item, for me?"

- [ ] **Step 1: Write failing test** covering: returns the live request, ignores terminal ones, returns undefined if no live request.

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement.** Copy `useAcceptedBorrowRequestForItem.ts` and change the `.eq('status', ...)` to `.in('status', ['pending','accepted','picked_up'])`. Rename queryKey constant to `LIVE_BORROW_REQUEST_FOR_ITEM_QUERY_KEY`.

- [ ] **Step 4: Add to invalidation list**

In `src/features/borrow/hooks/invalidateBorrowMutationCaches.ts`, add the new query key so any transition refreshes the banner.

- [ ] **Step 5: Run, verify pass; commit**

```bash
git commit -am "feat: usePendingBorrowRequestForItem for chat banner"
```

---

## Task 11: `BorrowRequestActionsBanner`

**Files:**
- Create: `src/features/borrow/components/BorrowRequestActionsBanner/BorrowRequestActionsBanner.tsx`
- Create: `BorrowRequestActionsBanner.test.tsx`
- Create: `BorrowRequestActionsBanner.stories.tsx`
- Modify: `src/features/borrow/index.ts`

**Component behavior:** Given a `BorrowRequestWithDetails` and current item status, render the action buttons that `getRequestActions` returns. Wire each to the matching hook with snackbar feedback on error.

- [ ] **Step 1: Write failing test**

```tsx
it('renders accept and decline for pending request when current user is owner', () => { /* ... */ });
it('renders mark-picked-up when accepted and item reserved', () => { /* ... */ });
it('renders mark-returned when picked_up and item loaned', () => { /* ... */ });
it('renders cancel for the requester while request is active', () => { /* ... */ });
it('renders nothing when no actions apply', () => { /* ... */ });
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement** using Paper `<Card.Actions>` or a custom row. No business logic in the component beyond calling `getRequestActions` and dispatching mutations. All copy via `t()` (`borrow` namespace).

- [ ] **Step 4: Write the story**

Use the same shape as `BorrowRequestCard.stories.tsx`. One story per state (pending, accepted, picked_up).

- [ ] **Step 5: Export + commit**

Add to `src/features/borrow/index.ts`:

```ts
export { BorrowRequestActionsBanner } from './components/BorrowRequestActionsBanner/BorrowRequestActionsBanner';
```

```bash
git commit -am "feat: BorrowRequestActionsBanner for inline chat actions"
```

---

## Task 12: Render banner in chat screen

**Files:**
- Modify: `app/(tabs)/messages/[id].tsx`
- Modify: `app/(tabs)/messages/__tests__/...` (whichever covers `[id].tsx`)

- [ ] **Step 1: Locate the existing chat screen test**, write a failing test:

```tsx
it('renders BorrowRequestActionsBanner when there is a live borrow request for the item', () => { /* ... */ });
it('does not render the banner when no live request exists', () => { /* ... */ });
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Integrate**

In `[id].tsx`, where the chat shell renders (just above the composer / just below `ItemContextStrip`):

```tsx
const { data: liveRequest } = usePendingBorrowRequestForItem(conversation?.itemId);
// ...
{liveRequest && <BorrowRequestActionsBanner request={liveRequest} />}
```

Decide placement carefully — likely *between* `ItemContextStrip` and the messages list, sticky-ish so it stays in view.

- [ ] **Step 4: Run, verify pass; commit**

```bash
git commit -am "feat: surface borrow actions in chat thread"
```

---

## Task 13: Update `ItemContextStrip` copy for new `Reserved` meaning

**Files:**
- Modify: `src/features/messaging/components/ItemContextStrip/ItemContextStrip.tsx`
- Modify: `src/shared/i18n/locales/*/messages.json`

The `borrowAccepted` context key today is used for both `Loaned` and `Reserved`. Under the new lifecycle:
- `Reserved` = accepted, awaiting pickup
- `Loaned` = picked up, currently borrowed

Split into two context keys: `borrowAwaitingPickup` (Reserved) and `borrowInProgress` (Loaned). Update tests accordingly.

- [ ] **Step 1: Test first** — assert the strip renders distinct copy for each.
- [ ] **Step 2: Run, verify fail**
- [ ] **Step 3: Implement** in `deriveContextKey`. Add new i18n keys.
- [ ] **Step 4: Run i18n validation**

```bash
npm run validate:i18n
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat: distinct chat context for reserved vs loaned"
```

---

## Task 14: Update `BorrowRequestCard` to surface pickup action

**Files:**
- Modify: `src/features/borrow/components/BorrowRequestCard/BorrowRequestCard.tsx`
- Modify: its test file

The legacy `/(tabs)/profile/borrow-requests` screen still lists requests. The card should reflect the new lifecycle: pickup action appears for accepted+owner, return action for picked_up+owner.

- [ ] **Step 1: Test first** — extend with cases for the pickup state.
- [ ] **Step 2: Run, verify fail**
- [ ] **Step 3: Implement** using `getRequestActions` (avoid duplicating the predicates).
- [ ] **Step 4: Run, verify pass; commit**

```bash
git commit -am "feat: BorrowRequestCard renders pickup action"
```

---

## Task 15: i18n strings for the new lifecycle

**Files:**
- Modify: `src/shared/i18n/locales/en/borrow.json` (+ each other locale present in `src/shared/i18n/locales/*/`)

Add (at minimum):

```json
{
  "actions": {
    "markPickedUp": "Mark as picked up"
  },
  "confirm": {
    "markPickedUp": {
      "title": "Mark item as picked up?",
      "message": "Confirm that {{borrowerName}} has picked up {{itemName}}.",
      "cancel": "Cancel",
      "confirm": "Mark picked up"
    }
  },
  "error": {
    "pickupFailed": "Could not mark as picked up. Try again."
  },
  "status": {
    "picked_up": "Picked up"
  }
}
```

- [ ] **Step 1: Add to `en`. Mirror in each other locale present.**
- [ ] **Step 2: Run i18n validation**

```bash
npm run validate:i18n
```

Expected: no missing/unused keys.

- [ ] **Step 3: Commit**

```bash
git add src/shared/i18n/locales/
git commit -m "i18n: pickup lifecycle strings"
```

---

## Task 15a: Update seed data for new lifecycle

**Files:**
- Modify: `supabase/seed.sql`

Existing seed has `accepted` borrow_requests against `loaned` items (e.g. `d0000001-0006`, `d0000001-0009`) and against `stored` items (e.g. `d0000002-0001`). Under the new lifecycle, that's inconsistent.

**Rule of thumb:**
- `accepted` request + `loaned` item → change request to `picked_up` (mid-loan, showcase the "borrowed" state).
- `accepted` request + `stored` item → change item to `reserved` (awaiting pickup state).

- [ ] **Step 1: Audit** — list every `accepted` borrow_request and the matching item status:

```bash
grep -nE "'accepted'" supabase/seed.sql
```

Cross-check with the items inserts.

- [ ] **Step 2: Update request rows** in the `borrow_requests` INSERT to use `picked_up` where the item is currently `loaned`:
  - `f2000001-0001-...` (Park Tool PCS-10.3 Stand, item `d0000001-0006` is `loaned`) → `picked_up`
  - `f2000001-0004-...` (Lezyne Digital Floor Drive, item `d0000001-0009` is `loaned`) → `picked_up`

- [ ] **Step 3: Update item rows** to `reserved` for `accepted`-request items that are currently `stored`:
  - `d0000002-0001-...` (Co-op torque wrench) → `reserved`
  - `d0000001-0005-4000-8000-000000000004` (Topeak Joe Blow Sport III) → `reserved`

- [ ] **Step 4: Reset DB to verify seed runs cleanly**

```bash
npm run db:reset
```

Expected: no constraint or trigger errors. The seed insert path bypasses the state-machine trigger (inserts only fire it for snapshot-owner), so this should just work.

- [ ] **Step 5: Spot-check via psql**

```bash
docker exec supabase_db_bike-bin psql -U postgres -d postgres -c \
  "SELECT br.id, br.status, i.status AS item_status FROM borrow_requests br JOIN items i ON i.id = br.item_id ORDER BY br.created_at;"
```

Expected: every `accepted` row has `item_status = reserved`; every `picked_up` row has `item_status = loaned`.

- [ ] **Step 6: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore: align seed data with three-step borrow lifecycle"
```

---

## Task 16: E2E happy path

**Files:**
- Create or modify: `e2e/borrow.spec.ts`

- [ ] **Step 1: Outline the spec**

```ts
test('borrow happy path: request → accept → pickup → return', async ({ page }) => {
  // 1. Sign in as requester
  // 2. Open a listing owned by other user
  // 3. Tap "Request to borrow", confirm dialog
  // 4. Expect navigation to /messages/[id], expect to see ItemContextStrip
  // 5. Sign in as owner in second browser context
  // 6. Open the same conversation, expect the BorrowRequestActionsBanner with Accept/Decline
  // 7. Tap Accept, expect item status to read "Reserved" / "Awaiting pickup"
  // 8. Tap Mark Picked Up, expect "Borrowed" / Loaned state
  // 9. Tap Mark Returned, expect status to revert to Stored
});
```

- [ ] **Step 2: Run, verify fail / scaffold**

```bash
npm run test:e2e -- borrow
```

- [ ] **Step 3: Iterate until green**

- [ ] **Step 4: Commit**

```bash
git add e2e/borrow.spec.ts
git commit -m "test: e2e borrow conversation happy path"
```

---

## Task 17: Audit `Reserved` copy across the app

**Files:**
- search-only

Per the design risk flagged in brainstorming: `Reserved` now means "accepted, awaiting pickup," not "request pending."

- [ ] **Step 1: Grep**

```bash
grep -rn -i "reserved" src/ app/ docs/
```

- [ ] **Step 2: For each user-facing occurrence**, decide:
  - **Inventory status badge** → still reads "Reserved" / "Awaiting pickup" — OK.
  - Anywhere that says "Reserved (someone has requested this)" → update copy.
  - Filters, tooltips, item-detail subtitles — review case by case.

- [ ] **Step 3: Commit any copy edits**

```bash
git commit -am "docs: align Reserved copy with new pickup lifecycle"
```

---

## Task 18: Docs

**Files:**
- Modify: `docs/feature-design.md` and/or `docs/functional-specs.md`
- Modify: `docs/datamodel.md` (note new `picked_up` enum value)

- [ ] **Step 1: Update the borrow flow narrative** in `feature-design.md` to describe the chat-first UX and three-step lifecycle.
- [ ] **Step 2: Update enum + RPC docs** in `datamodel.md`.
- [ ] **Step 3: Commit**

```bash
git commit -am "docs: borrow conversation + three-step lifecycle"
```

---

## Task 19: Validate + open PR

- [ ] **Step 1: Full validation**

```bash
npm run validate
```

Expected: format + lint + type-check + tests + build all green.

- [ ] **Step 2: Rebase on latest main**

```bash
git fetch origin && git rebase origin/main
```

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin feat/borrow-conversation
gh pr create --title "feat: borrow conversation thread + three-step lifecycle" --body ...
```

PR body should include:
- Summary (chat-first borrow UX, new pickup step, accept now means Reserved not Loaned)
- Migration impact (new enum value, RPC mapping change, item status changes for in-flight requests at deploy time — note any data fix needed for existing `Loaned` items)
- Test plan (RLS, unit, E2E)

---

## Decisions locked in

1. **No production data migration.** Pre-release — no users yet. Seed data is updated via Task 15a below.
2. **Owner-only pickup.** RPC + trigger + `canMarkPickedUp` all enforce `owner OR group admin` for the `accepted → picked_up` transition.
3. **No system messages in chat on borrow events** for v1. Worth a follow-up but requires `messages.kind` — out of scope.
