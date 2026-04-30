import type { LocationId, SavedLocation, SavedLocationRow } from '@/shared/types';

/** Transforms a Supabase row into the SavedLocation model. */
export function mapLocationRow(row: SavedLocationRow): SavedLocation {
  const coords = row.coordinates as { latitude: number; longitude: number } | null;
  return {
    id: row.id as LocationId,
    userId: row.user_id as SavedLocation['userId'],
    label: row.label,
    areaName: row.area_name ?? undefined,
    postcode: row.postcode ?? undefined,
    coordinates: coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  };
}
