import type { QueryClient } from '@tanstack/react-query';
import {
  GROUP_ITEMS_QUERY_KEY,
  ITEMS_QUERY_KEY,
  SEARCH_ITEMS_QUERY_KEY,
} from '@/shared/api/queryKeys';
import { BORROW_REQUESTS_QUERY_KEY } from './useBorrowRequests';

/**
 * Invalidate caches affected by a borrow-request mutation (create, cancel,
 * accept, decline, mark-returned). `extraKeys` covers per-mutation extras
 * such as accepted-request-for-item.
 */
export async function invalidateBorrowMutationCaches(
  queryClient: QueryClient,
  extraKeys: readonly string[] = [],
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: [BORROW_REQUESTS_QUERY_KEY] }),
    queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: GROUP_ITEMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: SEARCH_ITEMS_QUERY_KEY }),
    ...extraKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  ]);
}
