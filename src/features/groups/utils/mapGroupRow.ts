import type { Group, GroupMember } from '@/shared/types';
import type { GroupId, UserId } from '@/shared/types';
import type { GroupRow, GroupMemberRow } from '@/shared/types';
import type { GroupRole } from '@/shared/types';

/** Transforms a Supabase row into the Group domain model. */
export function mapGroupRow(row: GroupRow): Group {
  return {
    id: row.id as GroupId,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    isPublic: row.is_public as boolean,
    ratingAvg: (row.rating_avg as number | null) ?? 0,
    ratingCount: (row.rating_count as number | null) ?? 0,
    createdAt: row.created_at as string,
  };
}

/** Transforms a Supabase row into the GroupMember domain model. */
export function mapGroupMemberRow(row: GroupMemberRow): GroupMember {
  return {
    groupId: row.group_id as GroupId,
    userId: row.user_id as UserId,
    role: row.role as GroupRole,
    joinedAt: row.joined_at as string,
  };
}
