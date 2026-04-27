import type { BikeId, BikePhoto, BikePhotoId, BikePhotoRow } from '@/shared/types';

export function mapBikePhotoRow(row: BikePhotoRow): BikePhoto {
  return {
    id: row.id as BikePhotoId,
    bikeId: row.bike_id as BikeId,
    storagePath: row.storage_path as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}
