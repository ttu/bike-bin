# Test Coverage Improvement Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise test coverage from ~50% to ~90% across statements, branches, functions, and lines.

**Architecture:** Four phases targeting different code layers — pure functions first (highest ROI, easiest), then mutation hooks, query hooks, and finally components. Each phase has a coverage gate that must pass before proceeding.

**Tech Stack:** Jest, @testing-library/react-native, @tanstack/react-query, jest-expo, factories from `src/test/factories.ts`, `renderWithProviders` from `src/test/utils.tsx`

**Current State:**
| Metric | Current | Phase 1 Target | Phase 2 Target | Phase 3 Target | Phase 4 Target |
|--------|---------|----------------|----------------|----------------|----------------|
| Statements | 50% | 60% | 70% | 80% | 90% |
| Branches | 47% | 55% | 65% | 75% | 85% |
| Functions | 46% | 55% | 65% | 75% | 85% |
| Lines | 53% | 63% | 73% | 83% | 90% |

---

## Chunk 1: Phase 1 — Mapper Functions & Pure Utils (50% → 60%)

Mappers are pure functions with zero dependencies — highest ROI for coverage. Each mapper converts a snake_case Supabase row (`Record<string, unknown>`) to a typed domain model.

### Test Pattern for Mappers

All mapper tests follow this exact pattern:

```typescript
import { mapXxxRow } from '../mapXxxRow';
import type { XxxId } from '@/shared/types';

describe('mapXxxRow', () => {
  it('maps all required fields from snake_case to camelCase', () => {
    const row = {
      id: 'xxx-1',
      some_field: 'value',
      created_at: '2026-01-01T00:00:00Z',
    };
    const result = mapXxxRow(row);
    expect(result).toEqual({
      id: 'xxx-1',
      someField: 'value',
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('handles optional fields as undefined when missing', () => {
    const row = { id: 'xxx-1' /* only required */ };
    const result = mapXxxRow(row);
    expect(result.optionalField).toBeUndefined();
  });
});
```

### Task 1.1: mapBikeRow

**Files:**

- Test: `src/features/bikes/utils/__tests__/mapBikeRow.test.ts`
- Source: `src/features/bikes/utils/mapBikeRow.ts`

- [ ] **Step 1: Write the test**

```typescript
import { mapBikeRow } from '../mapBikeRow';

describe('mapBikeRow', () => {
  const fullRow = {
    id: 'bike-1',
    owner_id: 'user-1',
    name: 'My Gravel Bike',
    brand: 'Canyon',
    model: 'Grail',
    type: 'gravel',
    year: 2024,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  };

  it('maps all fields from snake_case to camelCase', () => {
    expect(mapBikeRow(fullRow)).toEqual({
      id: 'bike-1',
      ownerId: 'user-1',
      name: 'My Gravel Bike',
      brand: 'Canyon',
      model: 'Grail',
      type: 'gravel',
      year: 2024,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });
  });

  it('handles optional fields as undefined', () => {
    const minimalRow = {
      id: 'bike-2',
      owner_id: 'user-1',
      name: 'Unnamed',
      type: 'road',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapBikeRow(minimalRow);
    expect(result.brand).toBeUndefined();
    expect(result.model).toBeUndefined();
    expect(result.year).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm run test -- --testPathPattern="mapBikeRow" --verbose`
Expected: PASS (mapper already exists, test exercises it)

- [ ] **Step 3: Commit**

```bash
git add src/features/bikes/utils/__tests__/mapBikeRow.test.ts
git commit -m "test: add mapBikeRow unit tests"
```

### Task 1.2: mapGroupRow + mapGroupMemberRow

**Files:**

- Test: `src/features/groups/utils/__tests__/mapGroupRow.test.ts`
- Source: `src/features/groups/utils/mapGroupRow.ts`

- [ ] **Step 1: Write the test**

```typescript
import { mapGroupRow, mapGroupMemberRow } from '../mapGroupRow';

describe('mapGroupRow', () => {
  it('maps all fields', () => {
    const row = {
      id: 'group-1',
      name: 'MTB Club',
      description: 'Mountain biking group',
      is_public: true,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapGroupRow(row)).toEqual({
      id: 'group-1',
      name: 'MTB Club',
      description: 'Mountain biking group',
      isPublic: true,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('handles optional description as undefined', () => {
    const row = {
      id: 'group-2',
      name: 'Road Riders',
      is_public: false,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapGroupRow(row).description).toBeUndefined();
  });
});

describe('mapGroupMemberRow', () => {
  it('maps all fields', () => {
    const row = {
      group_id: 'group-1',
      user_id: 'user-1',
      role: 'admin',
      joined_at: '2026-01-15T00:00:00Z',
    };
    expect(mapGroupMemberRow(row)).toEqual({
      groupId: 'group-1',
      userId: 'user-1',
      role: 'admin',
      joinedAt: '2026-01-15T00:00:00Z',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm run test -- --testPathPattern="mapGroupRow" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/groups/utils/__tests__/mapGroupRow.test.ts
git commit -m "test: add mapGroupRow and mapGroupMemberRow unit tests"
```

### Task 1.3: mapNotificationRow

**Files:**

- Test: `src/features/notifications/utils/__tests__/mapNotificationRow.test.ts`
- Source: `src/features/notifications/utils/mapNotificationRow.ts`

- [ ] **Step 1: Write the test**

```typescript
import { mapNotificationRow } from '../mapNotificationRow';

describe('mapNotificationRow', () => {
  it('maps all fields', () => {
    const row = {
      id: 'notif-1',
      user_id: 'user-1',
      type: 'borrow_request',
      title: 'New request',
      body: 'Someone wants your derailleur',
      data: { itemId: 'item-1' },
      is_read: false,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapNotificationRow(row)).toEqual({
      id: 'notif-1',
      userId: 'user-1',
      type: 'borrow_request',
      title: 'New request',
      body: 'Someone wants your derailleur',
      data: { itemId: 'item-1' },
      isRead: false,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('handles optional body and defaults data to empty object', () => {
    const row = {
      id: 'notif-2',
      user_id: 'user-1',
      type: 'rating_received',
      title: 'New rating',
      is_read: true,
      created_at: '2026-01-01T00:00:00Z',
    };
    const result = mapNotificationRow(row);
    expect(result.body).toBeUndefined();
    expect(result.data).toEqual({});
  });
});
```

- [ ] **Step 2: Run test, then commit**

Run: `npm run test -- --testPathPattern="mapNotificationRow" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/notifications/utils/__tests__/mapNotificationRow.test.ts
git commit -m "test: add mapNotificationRow unit tests"
```

### Task 1.4: mapMessageRow

**Files:**

- Test: `src/features/messaging/utils/__tests__/mapMessageRow.test.ts`
- Source: `src/features/messaging/utils/mapMessageRow.ts`

- [ ] **Step 1: Write the test**

```typescript
import { mapMessageRow } from '../mapMessageRow';

describe('mapMessageRow', () => {
  const row = {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-A',
    body: 'Hey, is this part still available?',
    created_at: '2026-01-01T12:00:00Z',
  };

  it('maps fields and sets isOwn=true when sender is current user', () => {
    const result = mapMessageRow(row, 'user-A');
    expect(result).toEqual({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-A',
      body: 'Hey, is this part still available?',
      createdAt: '2026-01-01T12:00:00Z',
      isOwn: true,
    });
  });

  it('sets isOwn=false when sender is different user', () => {
    const result = mapMessageRow(row, 'user-B');
    expect(result.isOwn).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, then commit**

Run: `npm run test -- --testPathPattern="mapMessageRow" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/messaging/utils/__tests__/mapMessageRow.test.ts
git commit -m "test: add mapMessageRow unit tests"
```

### Task 1.5: mapProfileRow

**Files:**

- Test: `src/features/profile/utils/__tests__/mapProfileRow.test.ts`
- Source: `src/features/profile/utils/mapProfileRow.ts`

- [ ] **Step 1: Write the test**

```typescript
import { mapProfileRow } from '../mapProfileRow';

describe('mapProfileRow', () => {
  it('maps all fields', () => {
    const row = {
      id: 'user-1',
      display_name: 'BikeGuy',
      avatar_url: 'https://example.com/avatar.jpg',
      rating_avg: 4.5,
      rating_count: 12,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };
    expect(mapProfileRow(row)).toEqual({
      id: 'user-1',
      displayName: 'BikeGuy',
      avatarUrl: 'https://example.com/avatar.jpg',
      ratingAvg: 4.5,
      ratingCount: 12,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });
  });

  it('handles optional displayName and avatarUrl', () => {
    const row = {
      id: 'user-2',
      rating_avg: 0,
      rating_count: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapProfileRow(row);
    expect(result.displayName).toBeUndefined();
    expect(result.avatarUrl).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, then commit**

Run: `npm run test -- --testPathPattern="mapProfileRow" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/utils/__tests__/mapProfileRow.test.ts
git commit -m "test: add mapProfileRow unit tests"
```

### Task 1.6: mapRatingRow + mapRatingWithReviewerRow

**Files:**

- Test: `src/features/ratings/utils/__tests__/mapRatingRow.test.ts`
- Source: `src/features/ratings/utils/mapRatingRow.ts`

- [ ] **Step 1: Write the test**

```typescript
import { mapRatingRow, mapRatingWithReviewerRow } from '../mapRatingRow';

describe('mapRatingRow', () => {
  it('maps all fields', () => {
    const row = {
      id: 'rating-1',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      item_id: 'item-1',
      transaction_type: 'borrow',
      score: 4,
      text: 'Great condition!',
      editable_until: '2026-02-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(mapRatingRow(row)).toEqual({
      id: 'rating-1',
      fromUserId: 'user-A',
      toUserId: 'user-B',
      itemId: 'item-1',
      transactionType: 'borrow',
      score: 4,
      text: 'Great condition!',
      editableUntil: '2026-02-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('handles optional fields', () => {
    const row = {
      id: 'rating-2',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      transaction_type: 'donate',
      score: 5,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapRatingRow(row);
    expect(result.itemId).toBeUndefined();
    expect(result.text).toBeUndefined();
    expect(result.editableUntil).toBeUndefined();
  });
});

describe('mapRatingWithReviewerRow', () => {
  it('includes reviewer info from joined profiles', () => {
    const row = {
      id: 'rating-1',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      transaction_type: 'borrow',
      score: 4,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      profiles: { display_name: 'Alice', avatar_url: 'https://example.com/a.jpg' },
    };
    const result = mapRatingWithReviewerRow(row);
    expect(result.reviewer).toEqual({
      displayName: 'Alice',
      avatarUrl: 'https://example.com/a.jpg',
    });
  });

  it('handles missing profiles data', () => {
    const row = {
      id: 'rating-2',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      transaction_type: 'sell',
      score: 3,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapRatingWithReviewerRow(row);
    expect(result.reviewer).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test, then commit**

Run: `npm run test -- --testPathPattern="mapRatingRow" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/ratings/utils/__tests__/mapRatingRow.test.ts
git commit -m "test: add mapRatingRow and mapRatingWithReviewerRow unit tests"
```

### Task 1.7: Shared utils — formatRelativeTime, fetchThumbnailPaths

**Files:**

- Test: `src/shared/utils/__tests__/formatRelativeTime.test.ts`
- Test: `src/shared/utils/__tests__/fetchThumbnailPaths.test.ts`
- Source: `src/shared/utils/formatRelativeTime.ts`
- Source: `src/shared/utils/fetchThumbnailPaths.ts`

- [ ] **Step 1: Write formatRelativeTime test**

```typescript
import { formatRelativeTime } from '../formatRelativeTime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-21T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "just now" for times within the last minute', () => {
    const result = formatRelativeTime('2026-03-21T11:59:30Z');
    expect(result).toMatch(/just now|seconds/i);
  });

  it('returns minutes for recent times', () => {
    const result = formatRelativeTime('2026-03-21T11:55:00Z');
    expect(result).toMatch(/5.*min/i);
  });

  it('returns hours for same-day times', () => {
    const result = formatRelativeTime('2026-03-21T09:00:00Z');
    expect(result).toMatch(/3.*hour/i);
  });

  it('returns days for recent past', () => {
    const result = formatRelativeTime('2026-03-19T12:00:00Z');
    expect(result).toMatch(/2.*day/i);
  });

  it('returns formatted date for old timestamps', () => {
    const result = formatRelativeTime('2025-01-01T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Write fetchThumbnailPaths test**

```typescript
import { fetchThumbnailPaths } from '../fetchThumbnailPaths';

const mockSelect = jest.fn();
const mockIn = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

describe('fetchThumbnailPaths', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a map of itemId to storage path', async () => {
    mockSelect.mockReturnValue({
      in: mockIn.mockResolvedValue({
        data: [
          { item_id: 'item-1', storage_path: 'photos/1.jpg' },
          { item_id: 'item-2', storage_path: 'photos/2.jpg' },
        ],
        error: null,
      }),
    });

    const result = await fetchThumbnailPaths(['item-1', 'item-2']);
    expect(result.get('item-1')).toBe('photos/1.jpg');
    expect(result.get('item-2')).toBe('photos/2.jpg');
  });

  it('returns empty map when no item IDs provided', async () => {
    const result = await fetchThumbnailPaths([]);
    expect(result.size).toBe(0);
  });

  it('returns empty map on error', async () => {
    mockSelect.mockReturnValue({
      in: mockIn.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      }),
    });

    const result = await fetchThumbnailPaths(['item-1']);
    expect(result.size).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- --testPathPattern="(formatRelativeTime|fetchThumbnailPaths)" --verbose`

- [ ] **Step 4: Commit**

```bash
git add src/shared/utils/__tests__/formatRelativeTime.test.ts src/shared/utils/__tests__/fetchThumbnailPaths.test.ts
git commit -m "test: add formatRelativeTime and fetchThumbnailPaths unit tests"
```

### Task 1.8: Phase 1 Coverage Gate

- [ ] **Step 1: Run coverage and verify improvement**

Run: `npm run test:coverage -- --silent 2>&1 | grep "All files"`

Expected: Statements >= 60%, Lines >= 63%

- [ ] **Step 2: Update jest.config.js coverage threshold to 55%**

Update `jest.config.js` `coverageThreshold.global` values:

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 55,
    statements: 55,
  },
},
```

- [ ] **Step 3: Commit**

```bash
git add jest.config.js
git commit -m "chore: raise coverage threshold to 55%"
```

---

## Chunk 2: Phase 2 — Mutation Hooks (60% → 70%)

All mutation hooks follow the same pattern: `useMutation` wrapping a Supabase operation with `onSuccess` cache invalidation. Tests mock `supabase.from()` chain and verify: (1) correct table/params, (2) error propagation, (3) query invalidation.

### Test Pattern for Mutation Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase chain
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: mockUpdate,
      insert: mockInsert,
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}
```

### Task 2.1: Borrow mutation hooks (5 hooks)

**Files:**

- Test: `src/features/borrow/hooks/__tests__/useBorrowMutations.test.ts`
- Source: `src/features/borrow/hooks/useAcceptBorrowRequest.ts`
- Source: `src/features/borrow/hooks/useCancelBorrowRequest.ts`
- Source: `src/features/borrow/hooks/useCreateBorrowRequest.ts`
- Source: `src/features/borrow/hooks/useDeclineBorrowRequest.ts`
- Source: `src/features/borrow/hooks/useMarkReturned.ts`

All 5 borrow mutation hooks share the same pattern: update borrow_requests status + update item status. Test them in a single file.

- [ ] **Step 1: Write tests for all 5 borrow mutation hooks**

Each hook test needs:

1. Verify correct status update on borrow_requests table
2. Verify correct item status update
3. Verify error propagation
4. Verify auth check (throws when not authenticated)

Mock chain: `from('borrow_requests').update().eq().select().single()` → then `from('items').update().eq()`

- [ ] **Step 2: Run tests**

Run: `npm run test -- --testPathPattern="useBorrowMutations" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/borrow/hooks/__tests__/useBorrowMutations.test.ts
git commit -m "test: add borrow mutation hook tests (accept, cancel, create, decline, markReturned)"
```

### Task 2.2: Rating mutation hooks (3 hooks)

**Files:**

- Test: `src/features/ratings/hooks/__tests__/useRatingMutations.test.ts`
- Source: `src/features/ratings/hooks/useCreateRating.ts`
- Source: `src/features/ratings/hooks/useUpdateRating.ts`
- Source: `src/features/ratings/hooks/useDeleteRating.ts`

- [ ] **Step 1: Write tests**

Key differences from borrow hooks:

- `useCreateRating` calculates `editableUntil` and transforms response to Rating domain model
- `useUpdateRating` transforms response similarly
- `useDeleteRating` returns void, accesses `toUserId` from variables in onSuccess
- All invalidate `['ratings', toUserId]`

- [ ] **Step 2: Run tests**

Run: `npm run test -- --testPathPattern="useRatingMutations" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/ratings/hooks/__tests__/useRatingMutations.test.ts
git commit -m "test: add rating mutation hook tests (create, update, delete)"
```

### Task 2.3: Profile mutation hooks (3 hooks)

**Files:**

- Test: `src/features/profile/hooks/__tests__/useProfileMutations.test.ts`
- Source: `src/features/profile/hooks/useDeleteAccount.ts`
- Source: `src/features/profile/hooks/useSubmitSupport.ts`
- Source: `src/features/profile/hooks/useUpdateProfile.ts`

- [ ] **Step 1: Write tests**

Key differences:

- `useDeleteAccount` calls `supabase.auth.getSession()` then `supabase.functions.invoke('delete-account')`
- `useSubmitSupport` inserts to support_requests, works without auth
- `useUpdateProfile` conditionally includes fields, invalidates `['profile', userId]`

Need additional mocks for `supabase.auth.getSession` and `supabase.functions.invoke`.

- [ ] **Step 2: Run tests**

Run: `npm run test -- --testPathPattern="useProfileMutations" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/hooks/__tests__/useProfileMutations.test.ts
git commit -m "test: add profile mutation hook tests (deleteAccount, submitSupport, updateProfile)"
```

### Task 2.4: Group mutation hooks (3 hooks)

**Files:**

- Test: `src/features/groups/hooks/__tests__/useGroupMutations.test.ts`
- Source: `src/features/groups/hooks/useCreateGroup.ts`
- Source: `src/features/groups/hooks/useInviteMember.ts`
- Source: `src/features/groups/hooks/useJoinGroup.ts`

- [ ] **Step 1: Write tests**

Key differences:

- `useCreateGroup` does two inserts: groups + group_members (creator as admin)
- `useInviteMember` inserts to group_members
- `useJoinGroup` inserts to group_members, invalidates `['groups']`, `['group-members', groupId]`, `['search-groups']`

- [ ] **Step 2: Run tests**

Run: `npm run test -- --testPathPattern="useGroupMutations" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/groups/hooks/__tests__/useGroupMutations.test.ts
git commit -m "test: add group mutation hook tests (create, invite, join)"
```

### Task 2.5: Messaging mutation hooks (2 hooks)

**Files:**

- Test: `src/features/messaging/hooks/__tests__/useMessagingMutations.test.ts`
- Source: `src/features/messaging/hooks/useSendMessage.ts`
- Source: `src/features/messaging/hooks/useCreateConversation.ts`

- [ ] **Step 1: Write tests**

Key differences:

- `useSendMessage` inserts to messages with auth check, returns data via `.select().single()`
- `useCreateConversation` is complex: checks existing conversations first, conditionally creates new one with 2 participant inserts. Returns `{ conversationId, isExisting }`.

- [ ] **Step 2: Run tests**

Run: `npm run test -- --testPathPattern="useMessagingMutations" --verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/messaging/hooks/__tests__/useMessagingMutations.test.ts
git commit -m "test: add messaging mutation hook tests (sendMessage, createConversation)"
```

### Task 2.6: Remaining mutation hooks

**Files:**

- Test: `src/features/notifications/hooks/__tests__/useMarkNotificationRead.test.ts`
- Test: `src/features/locations/hooks/__tests__/useUpdateLocation.test.ts`

- [ ] **Step 1: Write useMarkNotificationRead test**

Simple: update notifications set is_read=true where id=X. Invalidates notification query keys.

- [ ] **Step 2: Write useUpdateLocation test**

Complex: conditional field updates, geocoding side effect, primary toggle logic. Mock `geocodePostcode`.

- [ ] **Step 3: Run tests**

Run: `npm run test -- --testPathPattern="(useMarkNotificationRead|useUpdateLocation)" --verbose`

- [ ] **Step 4: Commit**

```bash
git add src/features/notifications/hooks/__tests__/useMarkNotificationRead.test.ts src/features/locations/hooks/__tests__/useUpdateLocation.test.ts
git commit -m "test: add notification and location mutation hook tests"
```

### Task 2.7: Phase 2 Coverage Gate

- [ ] **Step 1: Run coverage**

Run: `npm run test:coverage -- --silent 2>&1 | grep "All files"`

Expected: Statements >= 70%, Lines >= 73%

- [ ] **Step 2: Update jest.config.js coverage threshold to 65%**

```javascript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 65,
    statements: 65,
  },
},
```

- [ ] **Step 3: Commit**

```bash
git add jest.config.js
git commit -m "chore: raise coverage threshold to 65%"
```

---

## Chunk 3: Phase 3 — Query Hooks & Shared Hooks (70% → 80%)

Query hooks use `useQuery`/`useInfiniteQuery` to fetch data from Supabase. Tests mock the Supabase chain and verify: (1) correct query key, (2) data mapping, (3) enabled conditions, (4) error handling.

### Test Pattern for Query Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockEq = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}
```

### Task 3.1: useBikes query hook

**Files:**

- Test: `src/features/bikes/hooks/__tests__/useBikes.test.ts`
- Source: `src/features/bikes/hooks/useBikes.ts`

- [ ] **Step 1: Write test**

Test: fetches bikes for current user, maps results, handles empty array, handles errors. Also test `useBike(id)` single fetch and enabled logic.

- [ ] **Step 2: Run and commit**

Run: `npm run test -- --testPathPattern="useBikes" --verbose`

```bash
git add src/features/bikes/hooks/__tests__/useBikes.test.ts
git commit -m "test: add useBikes and useBike query hook tests"
```

### Task 3.2: useBorrowRequests query hook

**Files:**

- Test: `src/features/borrow/hooks/__tests__/useBorrowRequests.test.ts`
- Source: `src/features/borrow/hooks/useBorrowRequests.ts`

- [ ] **Step 1: Write test**

Complex: tests the join + profile enrichment pattern. Mock the two-step query (borrow_requests with items join, then profiles batch fetch). Verify profile data is attached to results.

- [ ] **Step 2: Run and commit**

Run: `npm run test -- --testPathPattern="useBorrowRequests" --verbose`

```bash
git add src/features/borrow/hooks/__tests__/useBorrowRequests.test.ts
git commit -m "test: add useBorrowRequests query hook tests"
```

### Task 3.3: useGroupMembers + useSearchGroups

**Files:**

- Test: `src/features/groups/hooks/__tests__/useGroupMembers.test.ts`
- Test: `src/features/groups/hooks/__tests__/useSearchGroups.test.ts`

- [ ] **Step 1: Write useGroupMembers test**

Test: fetches members with profile join, maps correctly, includes promote/remove mutations.

- [ ] **Step 2: Write useSearchGroups test**

Test: multi-step fetch (groups + member counts + user memberships), enabled only when query >= 2 chars, returns SearchGroupResult with memberCount and isMember.

- [ ] **Step 3: Run and commit**

Run: `npm run test -- --testPathPattern="(useGroupMembers|useSearchGroups)" --verbose`

```bash
git add src/features/groups/hooks/__tests__/useGroupMembers.test.ts src/features/groups/hooks/__tests__/useSearchGroups.test.ts
git commit -m "test: add useGroupMembers and useSearchGroups query hook tests"
```

### Task 3.4: Messaging query hooks (useConversation, useConversations, useMessages)

**Files:**

- Test: `src/features/messaging/hooks/__tests__/useMessagingQueries.test.ts`
- Source: `src/features/messaging/hooks/useConversation.ts`
- Source: `src/features/messaging/hooks/useConversations.ts`
- Source: `src/features/messaging/hooks/useMessages.ts`

- [ ] **Step 1: Write tests**

- `useConversation`: single conversation fetch with items join + participant profile
- `useConversations`: complex multi-step (IDs → conversations → participants → last messages → profiles), sort by last message
- `useMessages`: infinite query with cursor pagination, PAGE_SIZE=30

- [ ] **Step 2: Run and commit**

Run: `npm run test -- --testPathPattern="useMessagingQueries" --verbose`

```bash
git add src/features/messaging/hooks/__tests__/useMessagingQueries.test.ts
git commit -m "test: add messaging query hook tests (conversation, conversations, messages)"
```

### Task 3.5: Notification query hooks

**Files:**

- Test: `src/features/notifications/hooks/__tests__/useNotificationQueries.test.ts`
- Source: `src/features/notifications/hooks/useNotifications.ts`
- Source: `src/features/notifications/hooks/useNotificationPreferences.ts`
- Source: `src/features/notifications/hooks/useUnreadNotificationCount.ts`

- [ ] **Step 1: Write tests**

- `useNotifications`: simple list query with mapNotificationRow
- `useNotificationPreferences`: JSONB parse with DEFAULT_PREFERENCES fallback, includes updatePreferences mutation
- `useUnreadNotificationCount`: uses `{ count: 'exact', head: true }` pattern

- [ ] **Step 2: Run and commit**

Run: `npm run test -- --testPathPattern="useNotificationQueries" --verbose`

```bash
git add src/features/notifications/hooks/__tests__/useNotificationQueries.test.ts
git commit -m "test: add notification query hook tests"
```

### Task 3.6: useUserRatings + useProfile

**Files:**

- Test: `src/features/ratings/hooks/__tests__/useUserRatings.test.ts`
- Test: `src/features/profile/hooks/__tests__/useProfile.test.ts`

- [ ] **Step 1: Write useUserRatings test**

Test: explicit fkey join, maps via mapRatingWithReviewerRow, enabled on userId.

- [ ] **Step 2: Write useProfile test**

Test: maps via mapProfileRow, enabled on userId.

- [ ] **Step 3: Run and commit**

Run: `npm run test -- --testPathPattern="(useUserRatings|useProfile)" --verbose`

```bash
git add src/features/ratings/hooks/__tests__/useUserRatings.test.ts src/features/profile/hooks/__tests__/useProfile.test.ts
git commit -m "test: add useUserRatings and useProfile query hook tests"
```

### Task 3.7: Realtime subscription hooks

**Files:**

- Test: `src/features/messaging/hooks/__tests__/useRealtimeMessages.test.ts`
- Test: `src/features/messaging/hooks/__tests__/useUnreadCount.test.ts`
- Test: `src/features/notifications/hooks/__tests__/useRealtimeNotifications.test.ts`

- [ ] **Step 1: Write tests**

All three are `useEffect`-based subscriptions. Test pattern:

1. Mock `supabase.channel()` returning `{ on: jest.fn().mockReturnThis(), subscribe: jest.fn() }`
2. Mock `supabase.removeChannel()`
3. Verify subscription is created with correct table/filter
4. Verify cleanup calls `removeChannel`
5. Simulate callback and verify query invalidation

- [ ] **Step 2: Run and commit**

Run: `npm run test -- --testPathPattern="(useRealtimeMessages|useUnreadCount|useRealtimeNotifications)" --verbose`

```bash
git add src/features/messaging/hooks/__tests__/useRealtimeMessages.test.ts src/features/messaging/hooks/__tests__/useUnreadCount.test.ts src/features/notifications/hooks/__tests__/useRealtimeNotifications.test.ts
git commit -m "test: add realtime subscription hook tests"
```

### Task 3.8: Shared hooks (useNetworkStatus, useOfflineQueue, useReport, useSearchFilters)

**Files:**

- Test: `src/shared/hooks/__tests__/useNetworkStatus.test.ts`
- Test: `src/shared/hooks/__tests__/useOfflineQueue.test.ts`
- Test: `src/shared/hooks/__tests__/useReport.test.ts`
- Test: `src/features/search/hooks/__tests__/useSearchFilters.test.ts`

- [ ] **Step 1: Write useNetworkStatus test**

Mock `@react-native-community/netinfo`. Test: returns `{ isOnline: true }` by default, updates on NetInfo change.

- [ ] **Step 2: Write useOfflineQueue test**

Mock AsyncStorage. Test: enqueue adds to queue, replays on reconnect, persists to storage.

- [ ] **Step 3: Write useReport test**

Simple mutation hook wrapping reports table insert.

- [ ] **Step 4: Write useSearchFilters test**

Context-based hook. Test with provider wrapper: updateFilters merges state, resetFilters keeps query, hasActiveFilters computed correctly.

- [ ] **Step 5: Run and commit**

Run: `npm run test -- --testPathPattern="(useNetworkStatus|useOfflineQueue|useReport|useSearchFilters)" --verbose`

```bash
git add src/shared/hooks/__tests__/useNetworkStatus.test.ts src/shared/hooks/__tests__/useOfflineQueue.test.ts src/shared/hooks/__tests__/useReport.test.ts src/features/search/hooks/__tests__/useSearchFilters.test.ts
git commit -m "test: add shared hook tests (networkStatus, offlineQueue, report, searchFilters)"
```

### Task 3.9: Phase 3 Coverage Gate

- [ ] **Step 1: Run coverage**

Run: `npm run test:coverage -- --silent 2>&1 | grep "All files"`

Expected: Statements >= 80%, Lines >= 83%

- [ ] **Step 2: Update jest.config.js coverage threshold to 75%**

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 75,
    statements: 75,
  },
},
```

- [ ] **Step 3: Commit**

```bash
git add jest.config.js
git commit -m "chore: raise coverage threshold to 75%"
```

---

## Chunk 4: Phase 4 — Untested Components (80% → 90%)

Components use `renderWithProviders` from `src/test/utils.tsx` and test: (1) renders with required props, (2) conditional rendering, (3) user interactions fire callbacks, (4) accessibility labels.

### Test Pattern for Components

```typescript
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { SomeComponent } from '../SomeComponent';

describe('SomeComponent', () => {
  const defaultProps = { /* required props */ };

  it('renders with required props', () => {
    const { getByText } = renderWithProviders(<SomeComponent {...defaultProps} />);
    expect(getByText('Expected text')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <SomeComponent {...defaultProps} onPress={onPress} />
    );
    fireEvent.press(getByLabelText('Button label'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Task 4.1: Simple presentational components (5 components)

**Files:**

- Test: `src/features/notifications/components/__tests__/NotificationBell.test.tsx`
- Test: `src/features/onboarding/components/__tests__/ProgressDots.test.tsx`
- Test: `src/shared/components/LoadingScreen/__tests__/LoadingScreen.test.tsx`
- Test: `src/features/bikes/components/BikeCard/__tests__/BikeCard.test.tsx`
- Test: `src/features/ratings/components/__tests__/ReviewCard.test.tsx`

- [ ] **Step 1: Write NotificationBell test**

Test: renders bell icon, shows badge when unreadCount > 0, hides badge when 0, shows "99+" for count > 99, calls onPress.

- [ ] **Step 2: Write ProgressDots test**

Test: renders correct number of dots (total), current dot has primary color, accessibility label "Step X of Y".

- [ ] **Step 3: Write LoadingScreen test**

Test: renders ActivityIndicator.

- [ ] **Step 4: Write BikeCard test**

Test: renders bike name, shows type chip, shows brand/year info, calls onPress with bike object.

- [ ] **Step 5: Write ReviewCard test**

Test: renders reviewer name, score as stars, transaction type badge, optional comment text, formatted date.

- [ ] **Step 6: Run and commit**

Run: `npm run test -- --testPathPattern="(NotificationBell|ProgressDots|LoadingScreen|BikeCard|ReviewCard)" --verbose`

```bash
git add src/features/notifications/components/__tests__/NotificationBell.test.tsx src/features/onboarding/components/__tests__/ProgressDots.test.tsx src/shared/components/LoadingScreen/__tests__/LoadingScreen.test.tsx src/features/bikes/components/BikeCard/__tests__/BikeCard.test.tsx src/features/ratings/components/__tests__/ReviewCard.test.tsx
git commit -m "test: add simple presentational component tests"
```

### Task 4.2: Interactive presentational components (4 components)

**Files:**

- Test: `src/features/inventory/components/PhotoPicker/__tests__/PhotoPicker.test.tsx`
- Test: `src/features/inventory/components/CategoryFilter/__tests__/CategoryFilter.test.tsx`
- Test: `src/features/messaging/components/__tests__/ItemReferenceCard.test.tsx`
- Test: `src/features/search/components/SearchBar/__tests__/SearchBar.test.tsx`

- [ ] **Step 1: Write PhotoPicker test**

Test: renders photo tiles, primary badge on first, add button calls onAdd, remove button calls onRemove with photoId, add button disabled when uploading, max 5 photos.

- [ ] **Step 2: Write CategoryFilter test**

Test: renders all category chips + "All", selected chip has different style, calls onSelect with category, calls onSelect(undefined) for "All".

- [ ] **Step 3: Write ItemReferenceCard test**

Test: renders null when item data missing, renders item name and availability types, view link calls onViewItem.

- [ ] **Step 4: Write SearchBar test**

Test: renders searchbar with query, calls onQueryChange on input, calls onSubmit on return key, shows area name, distance menu opens/closes.

- [ ] **Step 5: Run and commit**

Run: `npm run test -- --testPathPattern="(PhotoPicker|CategoryFilter|ItemReferenceCard|SearchBar)" --verbose`

```bash
git add src/features/inventory/components/PhotoPicker/__tests__/PhotoPicker.test.tsx src/features/inventory/components/CategoryFilter/__tests__/CategoryFilter.test.tsx src/features/messaging/components/__tests__/ItemReferenceCard.test.tsx src/features/search/components/SearchBar/__tests__/SearchBar.test.tsx
git commit -m "test: add interactive presentational component tests"
```

### Task 4.3: Complex components with state (4 components)

**Files:**

- Test: `src/features/locations/components/LocationForm/__tests__/LocationForm.test.tsx`
- Test: `src/features/bikes/components/BikeForm/__tests__/BikeForm.test.tsx`
- Test: `src/features/search/components/FilterSheet/__tests__/FilterSheet.test.tsx`
- Test: `src/shared/components/OfflineBanner/__tests__/OfflineBanner.test.tsx`

- [ ] **Step 1: Write LocationForm test**

Mock `geocodePostcode`. Test: validates required fields (shows error when empty), geocodes postcode on blur, shows area preview after geocode, calls onSave with data + geocoded, calls onCancel, primary toggle visibility.

- [ ] **Step 2: Write BikeForm test**

Test: validates name (required) and type (required), submits valid data, shows delete button only in edit mode, loading state on save button.

- [ ] **Step 3: Write FilterSheet test**

Test: renders category/condition/offer type chips, toggle selection, price range only visible when sellable selected, reset clears all, apply calls onApply.

- [ ] **Step 4: Write OfflineBanner test**

Mock `useNetworkStatus`. Test: hidden when online, shows banner when offline, dismiss hides banner.

- [ ] **Step 5: Run and commit**

Run: `npm run test -- --testPathPattern="(LocationForm|BikeForm|FilterSheet|OfflineBanner)" --verbose`

```bash
git add src/features/locations/components/LocationForm/__tests__/LocationForm.test.tsx src/features/bikes/components/BikeForm/__tests__/BikeForm.test.tsx src/features/search/components/FilterSheet/__tests__/FilterSheet.test.tsx src/shared/components/OfflineBanner/__tests__/OfflineBanner.test.tsx
git commit -m "test: add complex component tests (forms, filter sheet, offline banner)"
```

### Task 4.4: PhotoGallery component

**Files:**

- Test: `src/shared/components/PhotoGallery/__tests__/PhotoGallery.test.tsx`
- Source: `src/shared/components/PhotoGallery/PhotoGallery.tsx`

- [ ] **Step 1: Write test**

Mock `supabase.storage.from().getPublicUrl()`. Test: renders placeholder when no photos, renders images when photos provided, shows dots only when > 1 photo.

- [ ] **Step 2: Run and commit**

Run: `npm run test -- --testPathPattern="PhotoGallery" --verbose`

```bash
git add src/shared/components/PhotoGallery/__tests__/PhotoGallery.test.tsx
git commit -m "test: add PhotoGallery component tests"
```

### Task 4.5: useDemoQuerySeeder hook

**Files:**

- Test: `src/features/demo/__tests__/useDemoQuerySeeder.test.ts`
- Source: `src/features/demo/useDemoQuerySeeder.ts`

This hook has ~5% coverage and is one of the largest uncovered files. It seeds the query cache with mock data for demo mode.

- [ ] **Step 1: Write test**

Test: seeds query cache with demo data when demo mode is active, does nothing when not in demo mode. Mock queryClient.setQueryData calls.

- [ ] **Step 2: Run and commit**

Run: `npm run test -- --testPathPattern="useDemoQuerySeeder" --verbose`

```bash
git add src/features/demo/__tests__/useDemoQuerySeeder.test.ts
git commit -m "test: add useDemoQuerySeeder hook test"
```

### Task 4.6: Phase 4 Coverage Gate + Final Threshold

- [ ] **Step 1: Run final coverage**

Run: `npm run test:coverage -- --silent 2>&1 | grep "All files"`

Expected: Statements >= 88%, Lines >= 88%

- [ ] **Step 2: Update jest.config.js to final coverage threshold**

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 85,
    statements: 85,
  },
},
```

Set thresholds slightly below actual to allow for natural variance.

- [ ] **Step 3: Commit**

```bash
git add jest.config.js
git commit -m "chore: raise coverage threshold to 85%"
```

- [ ] **Step 4: Run full validation**

Run: `npm run validate`

Expected: All checks pass including new coverage threshold.

- [ ] **Step 5: Final commit**

```bash
git commit -m "test: complete test coverage improvement — 50% to 90%"
```

---

## Summary

| Phase     | Focus                                    | Tests Added (est.) | Coverage Target |
| --------- | ---------------------------------------- | ------------------ | --------------- |
| 1         | Mapper functions & pure utils            | ~25                | 60%             |
| 2         | Mutation hooks (16 hooks)                | ~65                | 70%             |
| 3         | Query hooks & shared hooks (20 hooks)    | ~80                | 80%             |
| 4         | Components (14 components) + demo seeder | ~70                | 90%             |
| **Total** |                                          | **~240 tests**     | **90%**         |

Each phase ends with a coverage gate commit that raises the threshold, preventing regressions.
