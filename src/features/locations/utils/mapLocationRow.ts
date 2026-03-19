import type { SavedLocation } from '@/shared/types';
import type { LocationId } from '@/shared/types';

/** Transforms a Supabase row into the SavedLocation model. */
export function mapLocationRow(row: Record<string, unknown>): SavedLocation {
  const coords = row.coordinates as { latitude: number; longitude: number } | null;
  return {
    id: row.id as LocationId,
    userId: row.user_id as SavedLocation['userId'],
    label: row.label as string,
    areaName: (row.area_name as string) ?? undefined,
    postcode: (row.postcode as string) ?? undefined,
    coordinates: coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined,
    isPrimary: row.is_primary as boolean,
    createdAt: row.created_at as string,
  };
}
