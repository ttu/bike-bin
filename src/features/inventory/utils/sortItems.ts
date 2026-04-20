import type { Item } from '@/shared/types';

export type InventorySortOption = 'recentlyAdded' | 'recentlyUpdated' | 'name';

export function sortItems(items: readonly Item[], sort: InventorySortOption): Item[] {
  const sorted = [...items];
  switch (sort) {
    case 'recentlyAdded':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'recentlyUpdated':
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}
