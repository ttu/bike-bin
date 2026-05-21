import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUuidV4 } from '@/shared/utils/randomUuid';
import {
  GroupRole,
  type ConversationId,
  type GroupId,
  type ItemId,
  type UserId,
} from '@/shared/types';

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

type ExistingConv = {
  id: string;
  conversation_participants: { user_id: string }[] | undefined;
};

async function fetchGroupAdminIds(supabase: SupabaseClient, groupId: GroupId): Promise<string[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('role', GroupRole.Admin);
  if (error) throw error;
  return (data ?? []).map((a: { user_id: string }) => a.user_id);
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
  supabase: SupabaseClient,
  itemId: ItemId,
  userId: string,
  otherUserId: UserId | undefined,
  groupId: GroupId | undefined,
): Promise<ConversationId | undefined> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`id, conversation_participants!inner (user_id)`)
    .eq('item_id', itemId);
  // Propagate the error so the caller doesn't silently fall through and create
  // a duplicate conversation when a transient read fails.
  if (error) throw error;
  if (!data) return undefined;
  const existing = data as unknown as ExistingConv[];

  const groupAdminIds =
    groupId === undefined ? undefined : await fetchGroupAdminIds(supabase, groupId);

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
  supabase: SupabaseClient,
  selfId: string,
  otherUserId: UserId | undefined,
  groupId: GroupId | undefined,
): Promise<string[]> {
  if (groupId !== undefined) {
    const admins = await fetchGroupAdminIds(supabase, groupId);
    return admins.filter((id) => id !== selfId);
  }
  return otherUserId === undefined ? [] : [otherUserId];
}

async function insertConversationAndParticipants(
  supabase: SupabaseClient,
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

export async function resolveConversation(
  args: ResolveConversationArgs,
): Promise<ResolveConversationResult> {
  const { supabase, itemId, selfId, otherUserId, groupId } = args;

  if (!otherUserId && !groupId) {
    throw new Error('Either otherUserId or groupId must be provided');
  }

  const existingId = await findExistingConversation(supabase, itemId, selfId, otherUserId, groupId);
  if (existingId) return { conversationId: existingId, isExisting: true };

  const otherParticipantIds = await resolveOtherParticipantIds(
    supabase,
    selfId,
    otherUserId,
    groupId,
  );
  const conversationId = await insertConversationAndParticipants(
    supabase,
    itemId,
    selfId,
    otherParticipantIds,
  );

  return { conversationId, isExisting: false };
}
