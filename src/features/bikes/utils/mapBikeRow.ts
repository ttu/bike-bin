import type { Bike } from '@/shared/types';
import type { BikeId, UserId } from '@/shared/types';
import type { BikeRow } from '@/shared/types';
import type { BikeType, ItemCondition } from '@/shared/types';
import { ItemCondition as ItemConditionValues } from '@/shared/types';

function mapOptionalNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : undefined;
}

function mapItemCondition(value: unknown): ItemCondition {
  const v = value as string | undefined;
  if (v === 'new' || v === 'good' || v === 'worn' || v === 'broken') return v;
  return ItemConditionValues.Good;
}

/** Transforms a Supabase row into the Bike domain model. */
export function mapBikeRow(row: BikeRow): Bike {
  return {
    id: row.id as BikeId,
    ownerId: row.owner_id as UserId,
    name: row.name as string,
    brand: (row.brand as string) ?? undefined,
    model: (row.model as string) ?? undefined,
    type: row.type as BikeType,
    year: (row.year as number) ?? undefined,
    distanceKm: mapOptionalNumber(row.distance_km),
    usageHours: mapOptionalNumber(row.usage_hours),
    condition: mapItemCondition(row.condition),
    notes: typeof row.notes === 'string' && row.notes.trim() ? row.notes.trim() : undefined,
    thumbnailStoragePath: undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
