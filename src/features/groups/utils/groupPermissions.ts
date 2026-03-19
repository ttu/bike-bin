import type { GroupMember } from '@/shared/types';
import { GroupRole } from '@/shared/types';

type MemberInfo = Pick<GroupMember, 'role' | 'userId'>;

export type MemberAction = 'promote' | 'remove';

/**
 * Whether a group member can invite new members.
 * True if the member is an admin.
 */
export function canInvite(member: MemberInfo): boolean {
  return member.role === GroupRole.Admin;
}

/**
 * Whether an actor can remove a target member from the group.
 * True if actor is admin and target is not the last admin.
 */
export function canRemoveMember(
  actor: MemberInfo,
  target: MemberInfo,
  allMembers: MemberInfo[],
): boolean {
  if (actor.role !== GroupRole.Admin) return false;

  // Cannot remove the last admin
  if (target.role === GroupRole.Admin) {
    const adminCount = allMembers.filter((m) => m.role === GroupRole.Admin).length;
    if (adminCount <= 1) return false;
  }

  return true;
}

/**
 * Whether a member can edit group details.
 * True if the member is an admin.
 */
export function canEditGroup(member: MemberInfo): boolean {
  return member.role === GroupRole.Admin;
}

/**
 * Whether a member can delete the group.
 * True if the member is an admin.
 */
export function canDeleteGroup(member: MemberInfo): boolean {
  return member.role === GroupRole.Admin;
}

/**
 * Whether an actor can promote a target member to admin.
 * True if actor is admin and target is currently a regular member.
 */
export function canPromoteMember(actor: MemberInfo, target: MemberInfo): boolean {
  return actor.role === GroupRole.Admin && target.role === GroupRole.Member;
}

/**
 * Whether a member can leave the group.
 * True unless member is the last admin (and there are other members).
 */
export function canLeaveGroup(member: MemberInfo, allMembers: MemberInfo[]): boolean {
  if (member.role !== GroupRole.Admin) return true;

  // If they're the only member, they can leave (group effectively deleted)
  if (allMembers.length <= 1) return true;

  // If there are other admins, they can leave
  const adminCount = allMembers.filter((m) => m.role === GroupRole.Admin).length;
  return adminCount > 1;
}

/**
 * Get available admin actions for a target member given the acting member.
 */
export function getAdminActions(
  actor: MemberInfo,
  target: MemberInfo,
  allMembers: MemberInfo[],
): MemberAction[] {
  const actions: MemberAction[] = [];

  if (canPromoteMember(actor, target)) {
    actions.push('promote');
  }
  if (canRemoveMember(actor, target, allMembers)) {
    actions.push('remove');
  }

  return actions;
}
