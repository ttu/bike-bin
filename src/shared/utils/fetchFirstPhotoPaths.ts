import { supabase } from '@/shared/api/supabase';

/**
 * Batch-fetches the first photo's storage_path for a list of entity IDs.
 *
 * @param table - The photo table to query (e.g. 'item_photos', 'bike_photos')
 * @param idColumn - The foreign key column name (e.g. 'item_id', 'bike_id')
 * @param ids - The entity IDs to look up
 */
export async function fetchFirstPhotoPaths(
  table: 'item_photos' | 'bike_photos',
  idColumn: 'item_id' | 'bike_id',
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const { data } = await supabase
    .from(table)
    .select(`${idColumn}, storage_path`)
    .in(idColumn, ids)
    .order('sort_order', { ascending: true });

  for (const row of (data as Record<string, unknown>[] | null) ?? []) {
    const entityId = row[idColumn] as string;
    if (!map.has(entityId)) {
      map.set(entityId, row['storage_path'] as string);
    }
  }
  return map;
}
