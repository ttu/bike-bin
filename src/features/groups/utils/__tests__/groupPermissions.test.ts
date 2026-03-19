import {
  canInvite,
  canRemoveMember,
  canEditGroup,
  canDeleteGroup,
  canPromoteMember,
  canLeaveGroup,
  getAdminActions,
} from '../groupPermissions';
import { createMockGroupMember } from '@/test/factories';
import { GroupRole } from '@/shared/types';
import type { UserId, GroupId } from '@/shared/types';

describe('groupPermissions', () => {
  const groupId = 'group-123' as GroupId;
  const adminId = 'admin-456' as UserId;
  const memberId = 'member-789' as UserId;
  const otherMemberId = 'member-012' as UserId;

  const adminMember = createMockGroupMember({
    groupId,
    userId: adminId,
    role: GroupRole.Admin,
  });

  const regularMember = createMockGroupMember({
    groupId,
    userId: memberId,
    role: GroupRole.Member,
  });

  const otherAdmin = createMockGroupMember({
    groupId,
    userId: otherMemberId,
    role: GroupRole.Admin,
  });

  describe('canInvite', () => {
    it('returns true if member is admin', () => {
      expect(canInvite(adminMember)).toBe(true);
    });

    it('returns false if member is not admin', () => {
      expect(canInvite(regularMember)).toBe(false);
    });
  });

  describe('canRemoveMember', () => {
    it('returns true if actor is admin and target is a regular member', () => {
      expect(canRemoveMember(adminMember, regularMember, [adminMember, regularMember])).toBe(true);
    });

    it('returns false if actor is not admin', () => {
      expect(canRemoveMember(regularMember, adminMember, [adminMember, regularMember])).toBe(false);
    });

    it('returns false if target is the last admin', () => {
      expect(canRemoveMember(adminMember, adminMember, [adminMember, regularMember])).toBe(false);
    });

    it('returns true if target is an admin but not the last one', () => {
      expect(
        canRemoveMember(adminMember, otherAdmin, [adminMember, otherAdmin, regularMember]),
      ).toBe(true);
    });

    it('returns false if actor tries to remove themselves as last admin', () => {
      expect(canRemoveMember(adminMember, adminMember, [adminMember])).toBe(false);
    });
  });

  describe('canEditGroup', () => {
    it('returns true if member is admin', () => {
      expect(canEditGroup(adminMember)).toBe(true);
    });

    it('returns false if member is not admin', () => {
      expect(canEditGroup(regularMember)).toBe(false);
    });
  });

  describe('canDeleteGroup', () => {
    it('returns true if member is admin', () => {
      expect(canDeleteGroup(adminMember)).toBe(true);
    });

    it('returns false if member is not admin', () => {
      expect(canDeleteGroup(regularMember)).toBe(false);
    });
  });

  describe('canPromoteMember', () => {
    it('returns true if actor is admin and target is a regular member', () => {
      expect(canPromoteMember(adminMember, regularMember)).toBe(true);
    });

    it('returns false if actor is not admin', () => {
      expect(canPromoteMember(regularMember, adminMember)).toBe(false);
    });

    it('returns false if target is already an admin', () => {
      expect(canPromoteMember(adminMember, otherAdmin)).toBe(false);
    });
  });

  describe('canLeaveGroup', () => {
    it('returns true if member is a regular member', () => {
      expect(canLeaveGroup(regularMember, [adminMember, regularMember])).toBe(true);
    });

    it('returns true if member is admin and there are other admins', () => {
      expect(canLeaveGroup(adminMember, [adminMember, otherAdmin, regularMember])).toBe(true);
    });

    it('returns false if member is the last admin', () => {
      expect(canLeaveGroup(adminMember, [adminMember, regularMember])).toBe(false);
    });

    it('returns true if member is the only member (and admin)', () => {
      expect(canLeaveGroup(adminMember, [adminMember])).toBe(true);
    });
  });

  describe('getAdminActions', () => {
    it('returns invite and edit for admin viewing a regular member', () => {
      const actions = getAdminActions(adminMember, regularMember, [adminMember, regularMember]);
      expect(actions).toContain('promote');
      expect(actions).toContain('remove');
    });

    it('returns no admin actions for a regular member', () => {
      const actions = getAdminActions(regularMember, adminMember, [adminMember, regularMember]);
      expect(actions).toHaveLength(0);
    });

    it('does not include promote for an already-admin target', () => {
      const actions = getAdminActions(adminMember, otherAdmin, [
        adminMember,
        otherAdmin,
        regularMember,
      ]);
      expect(actions).not.toContain('promote');
      expect(actions).toContain('remove');
    });

    it('does not include remove for the last admin', () => {
      const actions = getAdminActions(adminMember, adminMember, [adminMember, regularMember]);
      expect(actions).not.toContain('remove');
      expect(actions).not.toContain('promote');
    });
  });
});
