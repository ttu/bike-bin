import { supabase } from '@/shared/api/supabase';
import type { ItemId, BikeId } from '@/shared/types';

type PhotoTableConfig =
  | { table: 'item_photos'; idColumn: 'item_id'; ids: ItemId[] }
  | { table: 'bike_photos'; idColumn: 'bike_id'; ids: BikeId[] };

/**
 * Batch-fetches the first photo's storage_path for a list of entity IDs.
 */
export async function fetchFirstPhotoPaths<TId extends string>(
  config: PhotoTableConfig & { ids: TId[] },
): Promise<Map<TId, string>> {
  const map = new Map<TId, string>();
  if (config.ids.length === 0) return map;

  const { data } = await supabase
    .from(config.table)
    .select(`${config.idColumn}, storage_path`)
    .in(config.idColumn, config.ids)
    .order('sort_order', { ascending: true });

  for (const row of (data as Record<string, unknown>[] | null) ?? []) {
    const entityId = row[config.idColumn] as TId;
    if (!map.has(entityId)) {
      map.set(entityId, row['storage_path'] as string);
    }
  }
  return map;
}
