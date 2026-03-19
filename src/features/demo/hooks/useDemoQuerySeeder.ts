import { QueryClient } from '@tanstack/react-query';
import {
  DEMO_PROFILE,
  DEMO_ITEMS,
  DEMO_BIKES,
  DEMO_CONVERSATIONS,
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
export function seedDemoData(queryClient: QueryClient) {
  // Prevent real Supabase fetches from overwriting seeded data
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      staleTime: Infinity,
    },
  });

  queryClient.setQueryData(['items', uid], DEMO_ITEMS);
  queryClient.setQueryData(['bikes', uid], DEMO_BIKES);
  queryClient.setQueryData(['conversations', uid], DEMO_CONVERSATIONS);
  queryClient.setQueryData(['borrowRequests', uid], DEMO_BORROW_REQUESTS);
  queryClient.setQueryData(['unread_message_count', uid], DEMO_UNREAD_MESSAGE_COUNT);
  queryClient.setQueryData(['unread_notification_count', uid], DEMO_UNREAD_NOTIFICATION_COUNT);
  queryClient.setQueryData(['profile', DEMO_USER_ID], DEMO_PROFILE);
  queryClient.setQueryData(
    ['locations', 'primary', uid],
    DEMO_LOCATIONS.find((l) => l.isPrimary),
  );
}

export function clearDemoData(queryClient: QueryClient) {
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      staleTime: 5 * 60 * 1000, // restore default
    },
  });
}
