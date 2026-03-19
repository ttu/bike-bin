import type { Group, GroupMember } from '@/shared/types';
import type { GroupId, UserId } from '@/shared/types';
import type { GroupRole } from '@/shared/types';

/** Transforms a Supabase row into the Group domain model. */
export function mapGroupRow(row: Record<string, unknown>): Group {
  return {
    id: row.id as GroupId,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    isPublic: row.is_public as boolean,
    createdAt: row.created_at as string,
  };
}

/** Transforms a Supabase row into the GroupMember domain model. */
export function mapGroupMemberRow(row: Record<string, unknown>): GroupMember {
  return {
    groupId: row.group_id as GroupId,
    userId: row.user_id as UserId,
    role: row.role as GroupRole,
    joinedAt: row.joined_at as string,
  };
}
