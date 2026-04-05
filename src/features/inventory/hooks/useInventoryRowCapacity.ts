import { useAuth } from '@/features/auth';
import { useItems } from './useItems';
import { useMyInventoryItemLimit } from './useMyInventoryItemLimit';

export type InventoryRowCapacity = {
  /** True when the user already has at least `limit` item rows (signed-in + server only). */
  atLimit: boolean;
  itemRowCount: number;
  limit: number | undefined;
  /** False while items or limit query are still loading. */
  isReady: boolean;
};

/**
 * Signed-in server inventory: compares item row count to subscription-based limit.
 * Local / unsigned users are never atLimit.
 */
export function useInventoryRowCapacity(): InventoryRowCapacity {
  const { isAuthenticated, user } = useAuth();
  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: limit, isLoading: limitLoading } = useMyInventoryItemLimit();

  if (!isAuthenticated || !user) {
    return {
      atLimit: false,
      itemRowCount: 0,
      limit: undefined,
      isReady: true,
    };
  }

  const itemRowCount = items?.length ?? 0;
  const isReady = !itemsLoading && !limitLoading && limit !== undefined;
  const atLimit = isReady && limit !== undefined && itemRowCount >= limit;

  return {
    atLimit,
    itemRowCount,
    limit,
    isReady,
  };
}
