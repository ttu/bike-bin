import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { fetchPublicProfile } from '@/shared/api/fetchPublicProfile';
import { useAuth } from '@/features/auth';
import type { ConversationListItem } from '../types';
import type { ConversationId, ItemId, UserId } from '@/shared/types';
import type { AvailabilityType } from '@/shared/types';

export function useConversation(conversationId: ConversationId | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async (): Promise<ConversationListItem | undefined> => {
      if (!userId || !conversationId) return undefined;

      // Fetch conversation with item
      const { data: conv, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          item_id,
          created_at,
          items (
            id,
            owner_id,
            name,
            status,
            availability_types
          )
        `,
        )
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      if (!conv) return undefined;

      // Get other participant
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', userId);

      const otherParticipant = participants?.[0];

      let otherName: string | undefined;
      let otherAvatar: string | undefined;
      if (otherParticipant) {
        const profile = await fetchPublicProfile(otherParticipant.user_id as string);
        otherName = profile?.displayName;
        otherAvatar = profile?.avatarUrl;
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
        owner_id: string;
        name: string;
        status: string;
        availability_types: string[];
      } | null;

      return {
        id: conv.id as ConversationId,
        itemId: (conv.item_id as ItemId) ?? undefined,
        itemOwnerId: (item?.owner_id as UserId) ?? undefined,
        itemName: (item?.name as string) ?? undefined,
        itemStatus: (item?.status as string) ?? undefined,
        itemAvailabilityTypes: (item?.availability_types as AvailabilityType[]) ?? undefined,
        itemPhotoPath,
        otherParticipantId: (otherParticipant?.user_id ?? '') as UserId,
        otherParticipantName: otherName,
        otherParticipantAvatarUrl: otherAvatar,
        lastMessageBody: undefined,
        lastMessageSenderId: undefined,
        lastMessageAt: undefined,
        unreadCount: 0,
        createdAt: conv.created_at as string,
      };
    },
    enabled: !!userId && !!conversationId,
  });
}
