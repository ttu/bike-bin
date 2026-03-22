import { supabase } from '@/shared/api/supabase';

/** Batch-fetches the first photo's storage_path for a list of bike IDs. */
export async function fetchBikeThumbnailPaths(bikeIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (bikeIds.length === 0) return map;

  const { data } = await supabase
    .from('bike_photos')
    .select('bike_id, storage_path')
    .in('bike_id', bikeIds)
    .order('sort_order', { ascending: true });

  for (const row of data ?? []) {
    const bikeId = row.bike_id as string;
    if (!map.has(bikeId)) {
      map.set(bikeId, row.storage_path as string);
    }
  }
  return map;
}
