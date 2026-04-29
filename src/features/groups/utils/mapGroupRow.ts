import type {
  Group,
  GroupId,
  GroupMember,
  GroupMemberRow,
  GroupRole,
  GroupRow,
  UserId,
} from '@/shared/types';

/** Transforms a Supabase row into the Group domain model. */
export function mapGroupRow(row: GroupRow): Group {
  return {
    id: row.id as GroupId,
    name: row.name,
    description: row.description ?? undefined,
    isPublic: row.is_public,
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,
    createdAt: row.created_at,
  };
}

/** Transforms a Supabase row into the GroupMember domain model. */
export function mapGroupMemberRow(row: GroupMemberRow): GroupMember {
  return {
    groupId: row.group_id as GroupId,
    userId: row.user_id as UserId,
    role: row.role as GroupRole,
    joinedAt: row.joined_at,
  };
}
