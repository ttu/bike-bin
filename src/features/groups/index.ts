// Types
export type {
  GroupFormData,
  GroupWithRole,
  SearchGroupResult,
  GroupMemberWithProfile,
} from './types';

// Hooks
export { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from './hooks/useGroups';
export { useGroup } from './hooks/useGroup';
export { useGroupMembers, usePromoteMember, useRemoveMember } from './hooks/useGroupMembers';
export { useJoinGroup, useLeaveGroup } from './hooks/useJoinGroup';
export { useInviteMember } from './hooks/useInviteMember';
export { useSearchGroups } from './hooks/useSearchGroups';
export {
  canInvite,
  canRemoveMember,
  canEditGroup,
  canDeleteGroup,
  canPromoteMember,
  canLeaveGroup,
  getAdminActions,
} from './utils/groupPermissions';
export type { MemberAction } from './utils/groupPermissions';
