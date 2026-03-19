/**
 * Demo mode branded ID helpers.
 * These create fake branded IDs for demo data without needing real UUIDs.
 */
import type {
  UserId,
  ItemId,
  BikeId,
  ConversationId,
  MessageId,
  LocationId,
  BorrowRequestId,
  NotificationId,
} from '@/shared/types';

export const DEMO_USER_ID = 'demo-user-001' as UserId;
export const DEMO_OTHER_USER_1 = 'demo-user-002' as UserId;
export const DEMO_OTHER_USER_2 = 'demo-user-003' as UserId;
export const DEMO_OTHER_USER_3 = 'demo-user-004' as UserId;

export const DEMO_LOCATION_1 = 'demo-loc-001' as LocationId;
export const DEMO_LOCATION_2 = 'demo-loc-002' as LocationId;

export const DEMO_BIKE_1 = 'demo-bike-001' as BikeId;

export const DEMO_ITEM_1 = 'demo-item-001' as ItemId;
export const DEMO_ITEM_2 = 'demo-item-002' as ItemId;
export const DEMO_ITEM_3 = 'demo-item-003' as ItemId;
export const DEMO_ITEM_4 = 'demo-item-004' as ItemId;
export const DEMO_ITEM_5 = 'demo-item-005' as ItemId;
export const DEMO_ITEM_6 = 'demo-item-006' as ItemId;

export const DEMO_SEARCH_ITEM_1 = 'demo-search-001' as ItemId;
export const DEMO_SEARCH_ITEM_2 = 'demo-search-002' as ItemId;
export const DEMO_SEARCH_ITEM_3 = 'demo-search-003' as ItemId;
export const DEMO_SEARCH_ITEM_4 = 'demo-search-004' as ItemId;

export const DEMO_CONVERSATION_1 = 'demo-conv-001' as ConversationId;
export const DEMO_CONVERSATION_2 = 'demo-conv-002' as ConversationId;
export const DEMO_CONVERSATION_3 = 'demo-conv-003' as ConversationId;

export const DEMO_MESSAGE_1 = 'demo-msg-001' as MessageId;
export const DEMO_MESSAGE_2 = 'demo-msg-002' as MessageId;
export const DEMO_MESSAGE_3 = 'demo-msg-003' as MessageId;
export const DEMO_MESSAGE_4 = 'demo-msg-004' as MessageId;
export const DEMO_MESSAGE_5 = 'demo-msg-005' as MessageId;
export const DEMO_MESSAGE_6 = 'demo-msg-006' as MessageId;

export const DEMO_BORROW_REQUEST_1 = 'demo-borrow-001' as BorrowRequestId;
export const DEMO_BORROW_REQUEST_2 = 'demo-borrow-002' as BorrowRequestId;

export const DEMO_NOTIFICATION_1 = 'demo-notif-001' as NotificationId;
export const DEMO_NOTIFICATION_2 = 'demo-notif-002' as NotificationId;
export const DEMO_NOTIFICATION_3 = 'demo-notif-003' as NotificationId;
