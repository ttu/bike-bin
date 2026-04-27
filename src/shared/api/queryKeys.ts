/**
 * Cross-feature TanStack Query keys.
 *
 * Lives in `shared/` so that mutation hooks across features can invalidate
 * the same key without forming circular imports between feature slices
 * (e.g. `borrow` <-> `search`).
 */

/**
 * Query key prefix for the nearby-items search query (see
 * `features/search/hooks/useSearchItems`). Mutations that change an item's
 * status, visibility, or availability should invalidate this key so search
 * results reflect the new state.
 */
export const SEARCH_ITEMS_QUERY_KEY = ['search', 'items'] as const;
