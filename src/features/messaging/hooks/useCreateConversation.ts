import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { randomUuidV4 } from '@/shared/utils/randomUuid';
import { useAuth } from '@/features/auth';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import type { ConversationId, ItemId, UserId, GroupId } from '@/shared/types';

/**
 * Parameters for creating a conversation about an item.
 *
 * - For **personal items**, pass `otherUserId` (the item owner).
 * - For **group-owned items**, pass `groupId`; all of the group's admins will
 *   be added as participants so the shared inbox model works (any admin can
 *   reply on behalf of the group).
 *
 * Exactly one of `otherUserId` or `groupId` must be provided.
 */
interface CreateConversationParams {
  itemId: ItemId;
  otherUserId?: UserId;
  groupId?: GroupId;
}

interface CreateConversationResult {
  conversationId: ConversationId;
  isExisting: boolean;
}

type ExistingConv = {
  id: string;
  conversation_participants: { user_id: string }[] | undefined;
};

async function fetchGroupAdminIds(groupId: GroupId): Promise<string[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('role', 'admin');
  if (error) throw error;
  return (data ?? []).map((a) => a.user_id as string);
}

function participantIdsOf(conv: ExistingConv): string[] {
  return conv.conversation_participants?.map((p) => p.user_id) ?? [];
}

function matchesGroup(conv: ExistingConv, userId: string, groupAdminIds: string[]): boolean {
  const participantIds = participantIdsOf(conv);
  if (!participantIds.includes(userId)) return false;
  return groupAdminIds.some((id) => participantIds.includes(id));
}

function matchesUser(conv: ExistingConv, userId: string, otherUserId: string): boolean {
  const participantIds = participantIdsOf(conv);
  return participantIds.includes(userId) && participantIds.includes(otherUserId);
}

async function findExistingConversation(
  itemId: ItemId,
  userId: string,
  otherUserId: UserId | undefined,
  groupId: GroupId | undefined,
): Promise<ConversationId | undefined> {
  const { data } = await supabase
    .from('conversations')
    .select(`id, conversation_participants!inner (user_id)`)
    .eq('item_id', itemId);
  if (!data) return undefined;
  const existing = data as unknown as ExistingConv[];

  const groupAdminIds = groupId === undefined ? undefined : await fetchGroupAdminIds(groupId);

  for (const conv of existing) {
    if (groupAdminIds !== undefined) {
      if (matchesGroup(conv, userId, groupAdminIds)) return conv.id as ConversationId;
    } else if (otherUserId !== undefined && matchesUser(conv, userId, otherUserId)) {
      return conv.id as ConversationId;
    }
  }
  return undefined;
}

async function resolveOtherParticipantIds(
  selfId: string,
  otherUserId: UserId | undefined,
  groupId: GroupId | undefined,
): Promise<string[]> {
  if (groupId !== undefined) {
    const admins = await fetchGroupAdminIds(groupId);
    return admins.filter((id) => id !== selfId);
  }
  return otherUserId === undefined ? [] : [otherUserId];
}

async function insertConversationAndParticipants(
  itemId: ItemId,
  selfId: string,
  otherParticipantIds: string[],
): Promise<ConversationId> {
  const conversationId = randomUuidV4() as ConversationId;
  const { error: convError } = await supabase.from('conversations').insert({
    id: conversationId,
    item_id: itemId,
  });
  if (convError) throw convError;

  // Add self first — RLS STABLE helpers can't see rows from the same
  // INSERT statement, so the "add others" step must be a separate call.
  const { error: selfError } = await supabase
    .from('conversation_participants')
    .insert({ conversation_id: conversationId, user_id: selfId });
  if (selfError) throw selfError;

  if (otherParticipantIds.length > 0) {
    const { error: othersError } = await supabase
      .from('conversation_participants')
      .insert(
        otherParticipantIds.map((uid) => ({ conversation_id: conversationId, user_id: uid })),
      );
    if (othersError) {
      // Rollback: remove partial conversation to avoid one-sided state
      await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);
      await supabase.from('conversations').delete().eq('id', conversationId);
      throw othersError;
    }
  }
  return conversationId;
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemId,
      otherUserId,
      groupId,
    }: CreateConversationParams): Promise<CreateConversationResult> => {
      if (!user) throw new Error('Must be authenticated to create conversations');
      if (!otherUserId && !groupId) {
        throw new Error('Either otherUserId or groupId must be provided');
      }

      const existingId = await findExistingConversation(itemId, user.id, otherUserId, groupId);
      if (existingId) return { conversationId: existingId, isExisting: true };

      const otherParticipantIds = await resolveOtherParticipantIds(user.id, otherUserId, groupId);
      const conversationId = await insertConversationAndParticipants(
        itemId,
        user.id,
        otherParticipantIds,
      );

      return { conversationId, isExisting: false };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY],
      });
    },
  });
}
