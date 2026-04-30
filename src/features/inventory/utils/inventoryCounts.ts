import type { Item, ItemCategory } from '@/shared/types';
import { isTerminalStatus } from './status';

export type InventoryCounts = {
  items: number;
  mounted: number;
  listed: number;
};

export function computeInventoryCounts(
  items: readonly Item[],
  selectedCategory?: ItemCategory,
): InventoryCounts {
  const scoped = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;
  const active = scoped.filter((item) => !isTerminalStatus(item.status));
  return {
    items: active.length,
    mounted: active.filter((item) => item.status === 'mounted').length,
    listed: active.filter((item) => item.availabilityTypes.length > 0).length,
  };
}
