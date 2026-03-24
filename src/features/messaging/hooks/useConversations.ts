import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { ConversationListItem } from '../types';
import type { ConversationId, ItemId, UserId } from '@/shared/types';
import type { AvailabilityType } from '@/shared/types';

export const CONVERSATIONS_QUERY_KEY = 'conversations';

export function useConversations() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [CONVERSATIONS_QUERY_KEY, userId],
    queryFn: async (): Promise<ConversationListItem[]> => {
      if (!userId) return [];

      // Get all conversations the user participates in
      const { data: participantRows, error: pError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (pError) throw pError;
      if (!participantRows || participantRows.length === 0) return [];

      const conversationIds = participantRows.map((r) => r.conversation_id as string);

      // Fetch conversations with item info
      const { data: conversations, error: cError } = await supabase
        .from('conversations')
        .select(
          `
          id,
          item_id,
          created_at,
          items (
            id,
            name,
            status,
            availability_types
          )
        `,
        )
        .in('id', conversationIds)
        .order('created_at', { ascending: false });

      if (cError) throw cError;
      if (!conversations) return [];

      // Get other participants for each conversation
      const { data: allParticipants, error: apError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds)
        .neq('user_id', userId);

      if (apError) throw apError;

      // Get latest message for each conversation
      const results: ConversationListItem[] = [];

      for (const conv of conversations) {
        const otherParticipant = allParticipants?.find((p) => p.conversation_id === conv.id);

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('body, sender_id, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMsg = lastMessages?.[0];

        // Get other participant profile
        let otherName: string | undefined;
        let otherAvatar: string | undefined;
        if (otherParticipant) {
          const { data: profile } = await supabase
            .from('public_profiles')
            .select('display_name, avatar_url')
            .eq('id', otherParticipant.user_id)
            .single();
          otherName = (profile?.display_name as string) ?? undefined;
          otherAvatar = (profile?.avatar_url as string) ?? undefined;
        }

        // Get primary photo for item
        let itemPhotoPath: string | undefined;
        if (conv.item_id) {
          const { data: photos } = await supabase
            .from('item_photos')
            .select('storage_path')
            .eq('item_id', conv.item_id)
            .order('sort_order', { ascending: true })
            .limit(1);
          itemPhotoPath = (photos?.[0]?.storage_path as string) ?? undefined;
        }

        const item = (Array.isArray(conv.items) ? conv.items[0] : conv.items) as {
          id: string;
          name: string;
          status: string;
          availability_types: string[];
        } | null;

        results.push({
          id: conv.id as ConversationId,
          itemId: (conv.item_id as ItemId) ?? undefined,
          itemName: (item?.name as string) ?? undefined,
          itemStatus: (item?.status as string) ?? undefined,
          itemAvailabilityTypes: (item?.availability_types as AvailabilityType[]) ?? undefined,
          itemPhotoPath,
          otherParticipantId: (otherParticipant?.user_id ?? '') as UserId,
          otherParticipantName: otherName,
          otherParticipantAvatarUrl: otherAvatar,
          lastMessageBody: (lastMsg?.body as string) ?? undefined,
          lastMessageSenderId: (lastMsg?.sender_id as UserId) ?? undefined,
          lastMessageAt: (lastMsg?.created_at as string) ?? undefined,
          unreadCount: 0, // Implemented separately in useUnreadCount
          createdAt: conv.created_at as string,
        });
      }

      // Sort by last message timestamp (most recent first)
      results.sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return results;
    },
    enabled: !!userId,
  });
}
