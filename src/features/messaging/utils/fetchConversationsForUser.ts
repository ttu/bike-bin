import { supabase } from '@/shared/api/supabase';
import { fetchPublicProfilesMap } from '@/shared/api/fetchPublicProfile';
import type { ConversationListItem } from '../types';
import type { AvailabilityType, ConversationId, GroupId, ItemId, UserId } from '@/shared/types';

type ConvItem = {
  id: string;
  owner_id: string | null;
  group_id: string | null;
  name: string;
  status: string;
  availability_types: string[];
} | null;

type ConvRow = {
  id: string;
  item_id: string | null;
  created_at: string;
  items: ConvItem | ConvItem[];
};

type LastMessage = { body: string; sender_id: string; created_at: string };

function extractItem(row: ConvRow): ConvItem {
  return Array.isArray(row.items) ? row.items[0] : row.items;
}

async function fetchParticipantsByConversation(
  conversationIds: string[],
  userId: string,
): Promise<Map<string, { conversation_id: string; user_id: string }>> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', conversationIds)
    .neq('user_id', userId);
  if (error) throw error;
  const map = new Map<string, { conversation_id: string; user_id: string }>();
  for (const row of data ?? []) {
    const cid = row.conversation_id as string;
    if (!map.has(cid)) {
      map.set(cid, { conversation_id: cid, user_id: row.user_id as string });
    }
  }
  return map;
}

async function fetchLastMessages(conversationIds: string[]): Promise<Map<string, LastMessage>> {
  const { data, error } = await supabase.rpc('latest_messages_for_conversations', {
    p_conversation_ids: conversationIds,
  });
  if (error) throw error;
  const map = new Map<string, LastMessage>();
  for (const msg of data ?? []) {
    map.set(msg.conversation_id as string, {
      body: msg.body as string,
      sender_id: msg.sender_id as string,
      created_at: msg.created_at as string,
    });
  }
  return map;
}

async function fetchPrimaryPhotos(itemIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (itemIds.length === 0) return map;
  const { data, error } = await supabase.rpc('primary_photos_for_items', {
    p_item_ids: itemIds,
  });
  if (error) throw error;
  for (const photo of data ?? []) {
    map.set(photo.item_id as string, photo.storage_path as string);
  }
  return map;
}

async function fetchGroupNames(groupIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (groupIds.length === 0) return map;
  const uniqueGroupIds = [...new Set(groupIds)];
  const { data, error } = await supabase.from('groups').select('id, name').in('id', uniqueGroupIds);
  if (error) throw error;
  for (const g of data ?? []) {
    map.set(g.id as string, g.name as string);
  }
  return map;
}

async function fetchConversationsWithParticipants(userId: string): Promise<{
  rows: ConvRow[];
  conversationIds: string[];
  participantsByConversationId: Map<string, { conversation_id: string; user_id: string }>;
}> {
  const { data: participantRows, error: pError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);
  if (pError) throw pError;
  if (!participantRows || participantRows.length === 0) {
    return { rows: [], conversationIds: [], participantsByConversationId: new Map() };
  }

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
  if (!conversations) return { rows: [], conversationIds, participantsByConversationId: new Map() };

  const participantsByConversationId = await fetchParticipantsByConversation(
    conversationIds,
    userId,
  );
  return {
    rows: conversations as unknown as ConvRow[],
    conversationIds,
    participantsByConversationId,
  };
}

interface ConversationLookups {
  participantsByConversationId: Map<string, { conversation_id: string; user_id: string }>;
  profileByUserId: Awaited<ReturnType<typeof fetchPublicProfilesMap>>;
  lastMessageByConvId: Map<string, LastMessage>;
  photoByItemId: Map<string, string>;
  groupNameById: Map<string, string>;
}

function toConversationListItem(conv: ConvRow, lookups: ConversationLookups): ConversationListItem {
  const otherParticipant = lookups.participantsByConversationId.get(conv.id)!;
  const lastMsg = lookups.lastMessageByConvId.get(conv.id);
  const profile = lookups.profileByUserId.get(otherParticipant.user_id);
  const item = extractItem(conv);

  return {
    id: conv.id as ConversationId,
    itemId: (conv.item_id as ItemId) ?? undefined,
    itemOwnerId: item?.owner_id ? (item.owner_id as UserId) : undefined,
    itemGroupId: item?.group_id ? (item.group_id as GroupId) : undefined,
    groupName: item?.group_id ? lookups.groupNameById.get(item.group_id) : undefined,
    itemName: item?.name ?? undefined,
    itemStatus: item?.status ?? undefined,
    itemAvailabilityTypes: (item?.availability_types as AvailabilityType[]) ?? undefined,
    itemPhotoPath: conv.item_id ? lookups.photoByItemId.get(conv.item_id) : undefined,
    otherParticipantId: otherParticipant.user_id as UserId,
    otherParticipantName: profile?.displayName,
    otherParticipantAvatarUrl: profile?.avatarUrl,
    lastMessageBody: lastMsg?.body ?? undefined,
    lastMessageSenderId: (lastMsg?.sender_id as UserId) ?? undefined,
    lastMessageAt: lastMsg?.created_at ?? undefined,
    unreadCount: 0,
    createdAt: conv.created_at,
  };
}

function sortByMostRecent(a: ConversationListItem, b: ConversationListItem): number {
  const aTime = a.lastMessageAt ?? a.createdAt;
  const bTime = b.lastMessageAt ?? b.createdAt;
  return new Date(bTime).getTime() - new Date(aTime).getTime();
}

/** Loads the full conversation list for the signed-in user (Supabase + RPCs + profile map). */
export async function fetchConversationsForUser(userId: string): Promise<ConversationListItem[]> {
  const { rows, conversationIds, participantsByConversationId } =
    await fetchConversationsWithParticipants(userId);
  if (rows.length === 0) return [];

  const convsWithOther = rows.filter((c) => participantsByConversationId.has(c.id));

  const otherUserIds = [
    ...new Set(
      convsWithOther
        .map((c) => participantsByConversationId.get(c.id)?.user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const itemIds = convsWithOther.map((c) => c.item_id).filter((id): id is string => Boolean(id));
  const groupIds = convsWithOther
    .map((c) => extractItem(c)?.group_id)
    .filter((gid): gid is string => Boolean(gid));

  const [profileByUserId, lastMessageByConvId, photoByItemId, groupNameById] = await Promise.all([
    fetchPublicProfilesMap(otherUserIds),
    fetchLastMessages(conversationIds),
    fetchPrimaryPhotos(itemIds),
    fetchGroupNames(groupIds),
  ]);

  const lookups: ConversationLookups = {
    participantsByConversationId,
    profileByUserId,
    lastMessageByConvId,
    photoByItemId,
    groupNameById,
  };

  return convsWithOther.map((conv) => toConversationListItem(conv, lookups)).sort(sortByMostRecent);
}
