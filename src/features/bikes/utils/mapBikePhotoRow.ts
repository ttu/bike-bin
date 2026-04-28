import type { BikeId, BikePhoto, BikePhotoId, BikePhotoRow } from '@/shared/types';

export function mapBikePhotoRow(row: BikePhotoRow): BikePhoto {
  return {
    id: row.id as BikePhotoId,
    bikeId: row.bike_id as BikeId,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
