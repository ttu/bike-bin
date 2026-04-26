import type {
  AvailabilityType,
  ConversationId,
  GroupId,
  ItemId,
  MessageId,
  UserId,
} from '@/shared/types';

/** A conversation with last message and participant info, used for list display. */
export interface ConversationListItem {
  id: ConversationId;
  itemId: ItemId | undefined;
  /** Present when the nested item row is returned; used when `useItem` is still loading. */
  itemOwnerId: UserId | undefined;
  /** The group that owns the item, if this is a conversation about a group-owned item. */
  itemGroupId: GroupId | undefined;
  /** Display name of the owning group, when `itemGroupId` is set. */
  groupName: string | undefined;
  itemName: string | undefined;
  itemStatus: string | undefined;
  itemAvailabilityTypes: AvailabilityType[] | undefined;
  itemPhotoPath: string | undefined;
  otherParticipantId: UserId | undefined;
  otherParticipantName: string | undefined;
  otherParticipantAvatarUrl: string | undefined;
  lastMessageBody: string | undefined;
  lastMessageSenderId: UserId | undefined;
  lastMessageAt: string | undefined;
  unreadCount: number;
  createdAt: string;
}

/** True for conversations about group-owned items (shared inbox). */
export function isGroupConversation(conv: ConversationListItem): boolean {
  return conv.itemGroupId !== undefined;
}

/** A message with sender info for display. */
export interface MessageWithSender {
  id: MessageId;
  conversationId: ConversationId;
  /** Undefined when the sender account was deleted (GDPR anonymization). */
  senderId: UserId | undefined;
  body: string;
  createdAt: string;
  isOwn: boolean;
}
