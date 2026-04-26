import type { MessageId, ConversationId, UserId, MessageRow } from '@/shared/types';
import type { MessageWithSender } from '../types';

/** Transforms a Supabase message row into the MessageWithSender domain model. */
export function mapMessageRow(row: MessageRow, currentUserId: string): MessageWithSender {
  const senderId = (row.sender_id as UserId | null) ?? undefined;
  return {
    id: row.id as MessageId,
    conversationId: row.conversation_id as ConversationId,
    senderId,
    body: row.body as string,
    createdAt: row.created_at as string,
    isOwn: senderId !== undefined && senderId === currentUserId,
  };
}
