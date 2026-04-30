/**
 * Cross-feature TanStack Query keys.
 *
 * Lives in `shared/` so that mutation hooks across features can invalidate
 * the same key without forming circular imports between feature slices
 * (e.g. `borrow` <-> `search`).
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Query key prefix for the nearby-items search query (see
 * `features/search/hooks/useSearchItems`). Mutations that change an item's
 * status, visibility, or availability should invalidate this key so search
 * results reflect the new state.
 */
export const SEARCH_ITEMS_QUERY_KEY = ['search', 'items'] as const;

export const ITEMS_QUERY_KEY = ['items'] as const;
export const GROUP_ITEMS_QUERY_KEY = ['group-items'] as const;
export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const;
export const CONVERSATION_QUERY_KEY = ['conversation'] as const;

/**
 * Invalidate all caches that may reflect an item's state or any conversation
 * tied to it. Use after mutations that change item ownership, status, or
 * visibility (transfer, mark donated/sold, etc.). Prefix matches mean
 * `['items']` covers `['items', id]` and `['group-items']` covers
 * `['group-items', groupId]`.
 */
export async function invalidateItemAndConversationCaches(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: GROUP_ITEMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: SEARCH_ITEMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: CONVERSATION_QUERY_KEY }),
  ]);
}
