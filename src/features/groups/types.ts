import type { Group, GroupMember, UserProfile } from '@/shared/types';

export interface GroupFormData {
  name: string;
  description?: string;
  isPublic: boolean;
  postcode: string;
  country?: string;
  areaName: string;
  latitude: number;
  longitude: number;
}

export type GroupWithRole = Group & {
  memberRole: GroupMember['role'];
  joinedAt: string;
};

export interface SearchGroupResult extends Group {
  memberCount: number;
  isMember: boolean;
}

export type GroupMemberWithProfile = GroupMember & {
  profile: Pick<UserProfile, 'displayName' | 'avatarUrl'>;
};
