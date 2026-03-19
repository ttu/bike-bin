import type { ConversationId, ItemId, UserId, MessageId } from '@/shared/types';
import type { AvailabilityType } from '@/shared/types';

/** A conversation with last message and participant info, used for list display. */
export interface ConversationListItem {
  id: ConversationId;
  itemId: ItemId | undefined;
  itemName: string | undefined;
  itemStatus: string | undefined;
  itemAvailabilityTypes: AvailabilityType[] | undefined;
  itemPhotoPath: string | undefined;
  otherParticipantId: UserId;
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
  senderId: UserId;
  body: string;
  createdAt: string;
  isOwn: boolean;
}
