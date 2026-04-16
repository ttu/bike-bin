import type { ItemId } from '@/shared/types';
import { fetchFirstPhotoPaths } from './fetchFirstPhotoPaths';

/** Batch-fetches the first photo's storage_path for a list of item IDs. */
export async function fetchThumbnailPaths(itemIds: ItemId[]): Promise<Map<ItemId, string>> {
  return fetchFirstPhotoPaths({ table: 'item_photos', idColumn: 'item_id', ids: itemIds });
}
