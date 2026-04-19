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

      // Check if a conversation already exists where the current user is a
      // participant. For group items this is sufficient because the "other
      // side" is the group itself (represented by its admin roster, which is
      // kept in sync via trigger), so any conversation about the item that
      // the current user is part of is reused.
      const { data: existing } = await supabase
        .from('conversations')
        .select(
          `
          id,
          conversation_participants!inner (user_id)
        `,
        )
        .eq('item_id', itemId);

      if (existing) {
        // For group items, fetch the current admin roster so we can verify
        // the conversation's participants match the group (not a stale set
        // from a prior ownership).
        let groupAdminIds: string[] | undefined;
        if (groupId !== undefined) {
          const { data: admins } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('role', 'admin');
          groupAdminIds = (admins ?? []).map((a) => a.user_id as string);
        }

        for (const conv of existing) {
          const participants = conv.conversation_participants as { user_id: string }[] | undefined;
          const participantIds = participants?.map((p) => p.user_id) ?? [];
          if (!participantIds.includes(user.id)) continue;
          if (groupId !== undefined && groupAdminIds) {
            // Reuse only if at least one current group admin is a participant
            const hasGroupAdmin = groupAdminIds.some((id) => participantIds.includes(id));
            if (hasGroupAdmin) {
              return {
                conversationId: conv.id as ConversationId,
                isExisting: true,
              };
            }
            continue;
          }
          if (otherUserId !== undefined && participantIds.includes(otherUserId)) {
            return {
              conversationId: conv.id as ConversationId,
              isExisting: true,
            };
          }
        }
      }

      // Determine participants to add alongside the requester.
      // For group items: fetch all current admins and add them all.
      // For personal items: add the item owner.
      const otherParticipantIds: string[] = [];
      if (groupId !== undefined) {
        const { data: admins, error: adminErr } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('role', 'admin');
        if (adminErr) throw adminErr;
        for (const admin of admins ?? []) {
          const adminId = admin.user_id as string;
          if (adminId !== user.id) otherParticipantIds.push(adminId);
        }
      } else if (otherUserId !== undefined) {
        otherParticipantIds.push(otherUserId);
      }

      // Create new conversation (client id: INSERT…RETURNING is blocked by RLS until we are a participant)
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
        .insert({ conversation_id: conversationId, user_id: user.id });
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

      return {
        conversationId,
        isExisting: false,
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY],
      });
    },
  });
}
