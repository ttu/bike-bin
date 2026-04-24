// Types
export type { ConversationListItem, MessageWithSender } from './types';
export { isGroupConversation } from './types';

// Hooks
export { useConversations, CONVERSATIONS_QUERY_KEY } from './hooks/useConversations';
export { useConversation } from './hooks/useConversation';
export { useMessages, MESSAGES_QUERY_KEY } from './hooks/useMessages';
export { useSendMessage } from './hooks/useSendMessage';
export { useCreateConversation } from './hooks/useCreateConversation';
export { useRealtimeMessages } from './hooks/useRealtimeMessages';
export { useUnreadCount, UNREAD_COUNT_QUERY_KEY } from './hooks/useUnreadCount';
export {
  useUserBorrowHistory,
  USER_BORROW_HISTORY_QUERY_KEY,
  type UserBorrowHistory,
} from './hooks/useUserBorrowHistory';

// Components
export { ConversationCard } from './components/ConversationCard/ConversationCard';
export { ChatBubble } from './components/ChatBubble/ChatBubble';
export { ItemContextStrip } from './components/ItemContextStrip/ItemContextStrip';
