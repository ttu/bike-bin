import type { BikeId } from '@/shared/types';
import { fetchFirstPhotoPaths } from './fetchFirstPhotoPaths';

/** Batch-fetches the first photo's storage_path for a list of bike IDs. */
export async function fetchBikeThumbnailPaths(bikeIds: BikeId[]): Promise<Map<BikeId, string>> {
  return fetchFirstPhotoPaths({ table: 'bike_photos', idColumn: 'bike_id', ids: bikeIds });
}
