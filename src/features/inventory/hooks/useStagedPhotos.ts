import {
  useStagedEntityPhotos,
  type UseStagedEntityPhotosReturn,
} from '@/shared/hooks/useStagedEntityPhotos';
import type { ItemId } from '@/shared/types';

export function useStagedPhotos(): UseStagedEntityPhotosReturn<ItemId> {
  return useStagedEntityPhotos<ItemId>({
    pathPrefix: 'items',
    table: 'item_photos',
    entityIdColumn: 'item_id',
    invalidationKeys: (itemId) => [['item_photos', itemId], ['items']],
  });
}
