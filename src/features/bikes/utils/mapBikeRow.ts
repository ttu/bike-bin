import {
  ItemCondition as ItemConditionValues,
  type Bike,
  type BikeId,
  type BikeRow,
  type BikeType,
  type ItemCondition,
  type UserId,
} from '@/shared/types';

function mapOptionalNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
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
    name: row.name,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    type: row.type as BikeType,
    year: row.year ?? undefined,
    distanceKm: mapOptionalNumber(row.distance_km),
    usageHours: mapOptionalNumber(row.usage_hours),
    condition: mapItemCondition(row.condition),
    notes: typeof row.notes === 'string' && row.notes.trim() ? row.notes.trim() : undefined,
    thumbnailStoragePath: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
