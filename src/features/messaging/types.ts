import type { ConversationId, ItemId, UserId, MessageId } from '@/shared/types';
import type { AvailabilityType } from '@/shared/types';

/** A conversation with last message and participant info, used for list display. */
export interface ConversationListItem {
  id: ConversationId;
  itemId: ItemId | undefined;
  /** Present when the nested item row is returned; used when `useItem` is still loading. */
  itemOwnerId: UserId | undefined;
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
