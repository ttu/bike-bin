import { fetchFirstPhotoPaths } from './fetchFirstPhotoPaths';

/** Batch-fetches the first photo's storage_path for a list of item IDs. */
export async function fetchThumbnailPaths(itemIds: string[]): Promise<Map<string, string>> {
  return fetchFirstPhotoPaths('item_photos', 'item_id', itemIds);
}
