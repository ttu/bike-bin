import type { Bike } from '@/shared/types';
import type { BikeId, UserId } from '@/shared/types';
import type { BikeType } from '@/shared/types';

/** Transforms a Supabase row into the Bike domain model. */
export function mapBikeRow(row: Record<string, unknown>): Bike {
  return {
    id: row.id as BikeId,
    ownerId: row.owner_id as UserId,
    name: row.name as string,
    brand: (row.brand as string) ?? undefined,
    model: (row.model as string) ?? undefined,
    type: row.type as BikeType,
    year: (row.year as number) ?? undefined,
    thumbnailStoragePath: undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
