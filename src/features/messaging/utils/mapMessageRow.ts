import type { MessageId, ConversationId, UserId, MessageRow } from '@/shared/types';
import type { MessageWithSender } from '../types';

/** Transforms a Supabase message row into the MessageWithSender domain model. */
export function mapMessageRow(row: MessageRow, currentUserId: string): MessageWithSender {
  return {
    id: row.id as MessageId,
    conversationId: row.conversation_id as ConversationId,
    senderId: row.sender_id as UserId,
    body: row.body as string,
    createdAt: row.created_at as string,
    isOwn: row.sender_id === currentUserId,
  };
}
