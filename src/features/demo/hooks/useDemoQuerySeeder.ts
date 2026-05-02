import { QueryClient } from '@tanstack/react-query';
import {
  DEMO_PROFILE,
  DEMO_ITEMS,
  DEMO_BIKES,
  DEMO_CONVERSATIONS,
  DEMO_MESSAGES,
  DEMO_BORROW_REQUESTS,
  DEMO_UNREAD_MESSAGE_COUNT,
  DEMO_UNREAD_NOTIFICATION_COUNT,
  DEMO_LOCATIONS,
  DEMO_USER_ID,
} from '../data';

const uid = DEMO_USER_ID as string;

/**
 * Seeds TanStack Query cache with demo fixtures so existing hooks
 * return demo data without any per-screen conditional logic.
 *
 * Must be called synchronously BEFORE setting isDemoMode=true,
 * so the cache is populated before hooks mount and start querying.
 */
type SeededEntry = readonly [readonly unknown[], unknown];

function buildSeededEntries(): SeededEntry[] {
  const entries: SeededEntry[] = [
    [['items', uid], DEMO_ITEMS],
    [['bikes', uid], DEMO_BIKES],
    [['conversations', uid], DEMO_CONVERSATIONS],
    [['borrowRequests', uid], DEMO_BORROW_REQUESTS],
    [['unread_message_count', uid], DEMO_UNREAD_MESSAGE_COUNT],
    [['unread_notification_count', uid], DEMO_UNREAD_NOTIFICATION_COUNT],
    [['profile', DEMO_USER_ID], DEMO_PROFILE],
    [['locations', 'primary', uid], DEMO_LOCATIONS.find((l) => l.isPrimary)],
  ];
  for (const item of DEMO_ITEMS) {
    entries.push([['items', item.id], item]);
    entries.push([['item_photos', item.id], []]);
  }
  for (const bike of DEMO_BIKES) {
    entries.push([['bikes', bike.id], bike]);
  }
  for (const conv of DEMO_CONVERSATIONS) {
    entries.push([['conversation', conv.id], conv]);
    entries.push([
      ['messages', conv.id],
      { pages: [DEMO_MESSAGES[conv.id] ?? []], pageParams: [undefined] },
    ]);
  }
  return entries;
}

export function seedDemoData(queryClient: QueryClient) {
  for (const [key, value] of buildSeededEntries()) {
    // Per-key staleTime: Infinity prevents real fetches from overwriting seeded
    // data without affecting any non-demo queries on the same client.
    queryClient.setQueryDefaults(key, { staleTime: Infinity });
    queryClient.setQueryData(key, value);
  }
}

export function clearDemoData(queryClient: QueryClient) {
  for (const [key] of buildSeededEntries()) {
    queryClient.setQueryDefaults(key, { staleTime: undefined });
  }
  queryClient.clear();
}
