import { canEditItem, canDeleteItem, canTransferItem, canBorrowItem } from '../itemPermissions';
import { GroupRole, ItemStatus, type Item } from '@/shared/types';

const personalItem = (ownerId: string, status: ItemStatus = ItemStatus.Stored) =>
  ({
    ownerId,
    groupId: undefined,
    status,
  }) as unknown as Item;

const groupItem = (groupId: string, status: ItemStatus = ItemStatus.Stored) =>
  ({
    ownerId: undefined,
    groupId,
    status,
  }) as unknown as Item;

describe('itemPermissions', () => {
  describe('canEditItem', () => {
    it('owner can edit personal item', () => {
      expect(canEditItem(personalItem('u1'), 'u1', undefined)).toBe(true);
    });
    it('non-owner cannot edit personal item', () => {
      expect(canEditItem(personalItem('u1'), 'u2', undefined)).toBe(false);
    });
    it('group admin can edit group item', () => {
      expect(canEditItem(groupItem('g1'), 'u1', GroupRole.Admin)).toBe(true);
    });
    it('group member cannot edit group item', () => {
      expect(canEditItem(groupItem('g1'), 'u1', GroupRole.Member)).toBe(false);
    });
    it('non-member cannot edit group item', () => {
      expect(canEditItem(groupItem('g1'), 'u1', undefined)).toBe(false);
    });
  });

  describe('canDeleteItem', () => {
    it('owner can delete stored personal item', () => {
      expect(canDeleteItem(personalItem('u1'), 'u1', undefined)).toBe(true);
    });
    it('cannot delete a loaned item', () => {
      expect(canDeleteItem(personalItem('u1', ItemStatus.Loaned), 'u1', undefined)).toBe(false);
    });
    it('cannot delete a reserved item', () => {
      expect(canDeleteItem(personalItem('u1', ItemStatus.Reserved), 'u1', undefined)).toBe(false);
    });
    it('admin can delete stored group item', () => {
      expect(canDeleteItem(groupItem('g1'), 'u1', GroupRole.Admin)).toBe(true);
    });
  });

  describe('canTransferItem', () => {
    it('owner can transfer personal item in stored state', () => {
      expect(canTransferItem(personalItem('u1'), 'u1', undefined)).toBe(true);
    });
    it('cannot transfer a loaned item', () => {
      expect(canTransferItem(personalItem('u1', ItemStatus.Loaned), 'u1', undefined)).toBe(false);
    });
    it('group admin can transfer a group item', () => {
      expect(canTransferItem(groupItem('g1'), 'u1', GroupRole.Admin)).toBe(true);
    });
    it('group member cannot transfer a group item', () => {
      expect(canTransferItem(groupItem('g1'), 'u1', GroupRole.Member)).toBe(false);
    });
  });

  describe('canBorrowItem', () => {
    it('non-owner can borrow personal item', () => {
      expect(canBorrowItem(personalItem('u1'), 'u2', undefined)).toBe(true);
    });
    it('owner cannot borrow own personal item', () => {
      expect(canBorrowItem(personalItem('u1'), 'u1', undefined)).toBe(false);
    });
    it('group member can borrow group item', () => {
      expect(canBorrowItem(groupItem('g1'), 'u1', GroupRole.Member)).toBe(true);
    });
    it('group admin cannot borrow group item', () => {
      expect(canBorrowItem(groupItem('g1'), 'u1', GroupRole.Admin)).toBe(false);
    });
    it('non-member can borrow public group item', () => {
      expect(canBorrowItem(groupItem('g1'), 'u1', undefined)).toBe(true);
    });
  });
});
