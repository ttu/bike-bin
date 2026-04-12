import { supabase } from '@/shared/api/supabase';
import { fetchPublicProfilesMap } from '@/shared/api/fetchPublicProfile';
import type { ConversationListItem } from '../types';
import type { AvailabilityType, ConversationId, GroupId, ItemId, UserId } from '@/shared/types';

/** Loads the full conversation list for the signed-in user (Supabase + RPCs + profile map). */
export async function fetchConversationsForUser(userId: string): Promise<ConversationListItem[]> {
  const { data: participantRows, error: pError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (pError) throw pError;
  if (!participantRows || participantRows.length === 0) return [];

  const conversationIds = participantRows.map((r) => r.conversation_id as string);

  const { data: conversations, error: cError } = await supabase
    .from('conversations')
    .select(
      `
          id,
          item_id,
          created_at,
          items (
            id,
            owner_id,
            group_id,
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

  const { data: allParticipants, error: apError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', conversationIds)
    .neq('user_id', userId);

  if (apError) throw apError;

  const participantsByConversationId = new Map<
    string,
    { conversation_id: string; user_id: string }
  >();
  for (const row of allParticipants ?? []) {
    const cid = row.conversation_id as string;
    if (!participantsByConversationId.has(cid)) {
      participantsByConversationId.set(cid, row);
    }
  }

  const conversationsWithOtherParticipant = conversations.filter((c) =>
    participantsByConversationId.has(c.id as string),
  );

  const otherUserIds = [
    ...new Set(
      conversationsWithOtherParticipant
        .map((c) => {
          const p = participantsByConversationId.get(c.id as string);
          return p?.user_id as string | undefined;
        })
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const profileByUserId = await fetchPublicProfilesMap(otherUserIds);

  const { data: lastMessageRows, error: lastMessagesError } = await supabase.rpc(
    'latest_messages_for_conversations',
    { p_conversation_ids: conversationIds },
  );

  if (lastMessagesError) throw lastMessagesError;

  const lastMessageByConvId = new Map<
    string,
    { body: string; sender_id: string; created_at: string }
  >();
  for (const msg of lastMessageRows ?? []) {
    lastMessageByConvId.set(msg.conversation_id as string, {
      body: msg.body as string,
      sender_id: msg.sender_id as string,
      created_at: msg.created_at as string,
    });
  }

  const itemIds = conversationsWithOtherParticipant
    .map((c) => c.item_id)
    .filter((id): id is string => Boolean(id));
  const photoByItemId = new Map<string, string>();
  if (itemIds.length > 0) {
    const { data: primaryPhotoRows, error: primaryPhotosError } = await supabase.rpc(
      'primary_photos_for_items',
      { p_item_ids: itemIds },
    );

    if (primaryPhotosError) throw primaryPhotosError;

    for (const photo of primaryPhotoRows ?? []) {
      photoByItemId.set(photo.item_id as string, photo.storage_path as string);
    }
  }

  // Enrich group-owned items with group names
  const groupIds = conversationsWithOtherParticipant
    .map((c) => {
      const itm = (Array.isArray(c.items) ? c.items[0] : c.items) as {
        group_id?: string | null;
      } | null;
      return itm?.group_id;
    })
    .filter((gid): gid is string => Boolean(gid));

  const groupNameById = new Map<string, string>();
  if (groupIds.length > 0) {
    const uniqueGroupIds = [...new Set(groupIds)];
    const { data: groupRows } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', uniqueGroupIds);
    for (const g of groupRows ?? []) {
      groupNameById.set(g.id as string, g.name as string);
    }
  }

  const results: ConversationListItem[] = conversationsWithOtherParticipant.map((conv) => {
    const otherParticipant = participantsByConversationId.get(conv.id as string)!;
    const lastMsg = lastMessageByConvId.get(conv.id as string);

    const profile = profileByUserId.get(otherParticipant.user_id as string);
    const otherName = profile?.displayName;
    const otherAvatar = profile?.avatarUrl;

    const item = (Array.isArray(conv.items) ? conv.items[0] : conv.items) as {
      id: string;
      owner_id: string | null;
      group_id: string | null;
      name: string;
      status: string;
      availability_types: string[];
    } | null;

    return {
      id: conv.id as ConversationId,
      itemId: (conv.item_id as ItemId) ?? undefined,
      itemOwnerId: item?.owner_id ? (item.owner_id as UserId) : undefined,
      itemGroupId: item?.group_id ? (item.group_id as GroupId) : undefined,
      groupName: item?.group_id ? groupNameById.get(item.group_id) : undefined,
      itemName: (item?.name as string) ?? undefined,
      itemStatus: (item?.status as string) ?? undefined,
      itemAvailabilityTypes: (item?.availability_types as AvailabilityType[]) ?? undefined,
      itemPhotoPath: conv.item_id ? photoByItemId.get(conv.item_id as string) : undefined,
      otherParticipantId: otherParticipant.user_id as UserId,
      otherParticipantName: otherName,
      otherParticipantAvatarUrl: otherAvatar,
      lastMessageBody: lastMsg?.body ?? undefined,
      lastMessageSenderId: (lastMsg?.sender_id as UserId) ?? undefined,
      lastMessageAt: lastMsg?.created_at ?? undefined,
      unreadCount: 0,
      createdAt: conv.created_at as string,
    };
  });

  results.sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.createdAt;
    const bTime = b.lastMessageAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return results;
}
