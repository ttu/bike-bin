import type { UserProfile } from '@/shared/types';
import type { UserId } from '@/shared/types';

/** Transforms a Supabase row into the UserProfile domain model. */
export function mapProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as UserId,
    displayName: (row.display_name as string) ?? undefined,
    avatarUrl: (row.avatar_url as string) ?? undefined,
    distanceUnit: (row.distance_unit as string) ?? 'km',
    ratingAvg: row.rating_avg as number,
    ratingCount: row.rating_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
