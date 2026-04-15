import { fetchFirstPhotoPaths } from './fetchFirstPhotoPaths';

/** Batch-fetches the first photo's storage_path for a list of bike IDs. */
export async function fetchBikeThumbnailPaths(bikeIds: string[]): Promise<Map<string, string>> {
  return fetchFirstPhotoPaths('bike_photos', 'bike_id', bikeIds);
}
