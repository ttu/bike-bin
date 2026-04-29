import type { DistanceUnit, ProfileRow, UserId, UserProfile } from '@/shared/types';

/** Transforms a Supabase row into the UserProfile domain model. */
export function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id as UserId,
    displayName: (row.display_name as string) ?? undefined,
    avatarUrl: (row.avatar_url as string) ?? undefined,
    distanceUnit: (row.distance_unit as DistanceUnit) ?? 'km',
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
