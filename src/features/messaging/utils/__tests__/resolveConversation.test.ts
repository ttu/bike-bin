import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConversationId, GroupId, ItemId, UserId } from '@/shared/types';
import { resolveConversation } from '../resolveConversation';

jest.mock('@/shared/utils/randomUuid', () => ({
  randomUuidV4: jest.fn(() => 'conv-new'),
}));

// ---------------------------------------------------------------------------
// Minimal chainable Supabase mock builder
// ---------------------------------------------------------------------------

/** Build a mock supabase `from()` handler for a single table that returns a fixed result. */
function makeFrom(tableHandlers: Record<string, () => unknown>): SupabaseClient['from'] {
  return (table: string) => tableHandlers[table]?.() as ReturnType<SupabaseClient['from']>;
}

// ---------------------------------------------------------------------------
// 1. Validation: throws when neither otherUserId nor groupId is provided
// ---------------------------------------------------------------------------

describe('resolveConversation – validation', () => {
  it('throws when neither otherUserId nor groupId is provided', async () => {
    const supabase = { from: jest.fn() } as unknown as SupabaseClient;
    await expect(
      resolveConversation({
        supabase,
        itemId: 'item-1' as ItemId,
        selfId: 'user-self',
      }),
    ).rejects.toThrow('Either otherUserId or groupId must be provided');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. Returns existing conversation for (itemId, selfId, otherUserId)
// ---------------------------------------------------------------------------

describe('resolveConversation – existing personal conversation', () => {
  it('returns existing conversationId without creating a new one', async () => {
    const insertMock = jest.fn();
    const supabase = {
      from: makeFrom({
        conversations: () => ({
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  {
                    id: 'conv-existing' as ConversationId,
                    conversation_participants: [
                      { user_id: 'user-self' },
                      { user_id: 'user-other' },
                    ],
                  },
                ],
              }),
          }),
        }),
        conversation_participants: () => ({ insert: insertMock }),
      }),
    } as unknown as SupabaseClient;

    const result = await resolveConversation({
      supabase,
      itemId: 'item-1' as ItemId,
      selfId: 'user-self',
      otherUserId: 'user-other' as UserId,
    });

    expect(result).toEqual({ conversationId: 'conv-existing', isExisting: true });
    expect(insertMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 3. Creates a new conversation when none exists (personal item)
// ---------------------------------------------------------------------------

describe('resolveConversation – create personal conversation', () => {
  it('inserts conversation + self + otherUserId and returns new id', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });

    const supabase = {
      from: makeFrom({
        conversations: () => ({
          select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
          insert: insertMock,
        }),
        conversation_participants: () => ({ insert: insertMock }),
      }),
    } as unknown as SupabaseClient;

    const result = await resolveConversation({
      supabase,
      itemId: 'item-1' as ItemId,
      selfId: 'user-self',
      otherUserId: 'user-other' as UserId,
    });

    expect(result).toEqual({ conversationId: 'conv-new', isExisting: false });
    // 3 inserts: conversation, self-participant, other-participant
    expect(insertMock).toHaveBeenCalledTimes(3);
    expect(insertMock).toHaveBeenNthCalledWith(1, { id: 'conv-new', item_id: 'item-1' });
    expect(insertMock).toHaveBeenNthCalledWith(2, {
      conversation_id: 'conv-new',
      user_id: 'user-self',
    });
    expect(insertMock).toHaveBeenNthCalledWith(3, [
      { conversation_id: 'conv-new', user_id: 'user-other' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 4. Group conversation: fetches admins and creates participants accordingly
// ---------------------------------------------------------------------------

describe('resolveConversation – group conversation', () => {
  it('creates conversation with group admins as other participants', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });

    const supabase = {
      from: makeFrom({
        conversations: () => ({
          select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
          insert: insertMock,
        }),
        group_members: () => ({
          select: () => ({
            eq: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ user_id: 'admin-1' }, { user_id: 'admin-2' }],
                  error: null,
                }),
            }),
          }),
        }),
        conversation_participants: () => ({ insert: insertMock }),
      }),
    } as unknown as SupabaseClient;

    const result = await resolveConversation({
      supabase,
      itemId: 'item-1' as ItemId,
      selfId: 'user-self',
      groupId: 'group-1' as GroupId,
    });

    expect(result).toEqual({ conversationId: 'conv-new', isExisting: false });

    // 3 inserts: conversation, self-participant, admins as other participants
    expect(insertMock).toHaveBeenCalledTimes(3);

    const othersArg = insertMock.mock.calls[2][0] as Array<{ user_id: string }>;
    const otherIds = othersArg.map((p) => p.user_id);
    expect(otherIds).toContain('admin-1');
    expect(otherIds).toContain('admin-2');
    // selfId must not appear in others
    expect(otherIds).not.toContain('user-self');
  });

  it('returns existing group conversation when an admin is already a participant', async () => {
    const insertMock = jest.fn();

    const supabase = {
      from: makeFrom({
        conversations: () => ({
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  {
                    id: 'conv-group-existing' as ConversationId,
                    conversation_participants: [{ user_id: 'user-self' }, { user_id: 'admin-1' }],
                  },
                ],
              }),
          }),
        }),
        group_members: () => ({
          select: () => ({
            eq: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ user_id: 'admin-1' }, { user_id: 'admin-2' }],
                  error: null,
                }),
            }),
          }),
        }),
        conversation_participants: () => ({ insert: insertMock }),
      }),
    } as unknown as SupabaseClient;

    const result = await resolveConversation({
      supabase,
      itemId: 'item-1' as ItemId,
      selfId: 'user-self',
      groupId: 'group-1' as GroupId,
    });

    expect(result).toEqual({ conversationId: 'conv-group-existing', isExisting: true });
    expect(insertMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. Rollback: deletes partially-inserted conversation if "insert others" fails
// ---------------------------------------------------------------------------

describe('resolveConversation – rollback on partial failure', () => {
  it('deletes conversation and participants when other-participant insert fails', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const deleteMock = jest.fn(() => ({ eq: eqMock }));
    const insertMock = jest
      .fn()
      .mockResolvedValueOnce({ error: null }) // conversations.insert OK
      .mockResolvedValueOnce({ error: null }) // self participant OK
      .mockResolvedValueOnce({ error: { message: 'RLS violation' } }); // others fail

    const supabase = {
      from: makeFrom({
        conversations: () => ({
          select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
          insert: insertMock,
          delete: deleteMock,
        }),
        conversation_participants: () => ({
          insert: insertMock,
          delete: deleteMock,
        }),
      }),
    } as unknown as SupabaseClient;

    await expect(
      resolveConversation({
        supabase,
        itemId: 'item-1' as ItemId,
        selfId: 'user-self',
        otherUserId: 'user-other' as UserId,
      }),
    ).rejects.toMatchObject({ message: 'RLS violation' });

    // Rollback: 2 deletes (participants then conversation)
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(eqMock).toHaveBeenCalledWith('conversation_id', 'conv-new');
    expect(eqMock).toHaveBeenCalledWith('id', 'conv-new');
  });
});
