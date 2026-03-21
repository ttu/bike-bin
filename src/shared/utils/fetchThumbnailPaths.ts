import { supabase } from '@/shared/api/supabase';

/** Batch-fetches the first photo's storage_path for a list of item IDs. */
export async function fetchThumbnailPaths(itemIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (itemIds.length === 0) return map;

  const { data } = await supabase
    .from('item_photos')
    .select('item_id, storage_path')
    .in('item_id', itemIds)
    .order('sort_order', { ascending: true });

  for (const row of data ?? []) {
    const itemId = row.item_id as string;
    if (!map.has(itemId)) {
      map.set(itemId, row.storage_path as string);
    }
  }
  return map;
}
