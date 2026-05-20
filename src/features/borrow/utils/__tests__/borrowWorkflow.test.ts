import {
  canRequestBorrow,
  canAcceptRequest,
  canDeclineRequest,
  canCancelRequest,
  canMarkPickedUp,
  canMarkReturned,
  getRequestActions,
} from '../borrowWorkflow';
import { createMockItem, createMockBorrowRequest } from '@/test/factories';
import { AvailabilityType, BorrowRequestStatus, ItemStatus, type UserId } from '@/shared/types';

describe('borrowWorkflow', () => {
  const ownerId = 'owner-123' as UserId;
  const requesterId = 'requester-456' as UserId;

  describe('canRequestBorrow', () => {
    it('returns true when item is Borrowable and Stored', () => {
      const item = createMockItem({
        status: ItemStatus.Stored,
        availabilityTypes: [AvailabilityType.Borrowable],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(true);
    });

    it('returns true when item has multiple availability types including Borrowable', () => {
      const item = createMockItem({
        status: ItemStatus.Stored,
        availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Donatable],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(true);
    });

    it('returns false when item is not Borrowable', () => {
      const item = createMockItem({
        status: ItemStatus.Stored,
        availabilityTypes: [AvailabilityType.Donatable],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(false);
    });

    it('returns false when item is Reserved', () => {
      const item = createMockItem({
        status: ItemStatus.Reserved,
        availabilityTypes: [AvailabilityType.Borrowable],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(false);
    });

    it('returns false when item is Loaned', () => {
      const item = createMockItem({
        status: ItemStatus.Loaned,
        availabilityTypes: [AvailabilityType.Borrowable],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(false);
    });

    it('returns false when item is Donated', () => {
      const item = createMockItem({
        status: ItemStatus.Donated,
        availabilityTypes: [AvailabilityType.Borrowable],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(false);
    });

    it('returns false when item is Sold', () => {
      const item = createMockItem({
        status: ItemStatus.Sold,
        availabilityTypes: [AvailabilityType.Borrowable],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(false);
    });

    it('returns false when user is the item owner', () => {
      const item = createMockItem({
        status: ItemStatus.Stored,
        availabilityTypes: [AvailabilityType.Borrowable],
        ownerId,
      });
      expect(canRequestBorrow(item, ownerId)).toBe(false);
    });

    it('returns false when item is Private', () => {
      const item = createMockItem({
        status: ItemStatus.Stored,
        availabilityTypes: [AvailabilityType.Private],
        ownerId,
      });
      expect(canRequestBorrow(item, requesterId)).toBe(false);
    });
  });

  describe('canAcceptRequest', () => {
    it('returns true when request is pending and user is item owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
      });
      expect(canAcceptRequest(request, ownerId, ownerId)).toBe(true);
    });

    it('returns false when request is not pending', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      expect(canAcceptRequest(request, ownerId, ownerId)).toBe(false);
    });

    it('returns false when user is not the item owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
      });
      expect(canAcceptRequest(request, requesterId, ownerId)).toBe(false);
    });

    it('returns false when request is cancelled', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Cancelled,
      });
      expect(canAcceptRequest(request, ownerId, ownerId)).toBe(false);
    });

    it('returns false when request is rejected', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Rejected,
      });
      expect(canAcceptRequest(request, ownerId, ownerId)).toBe(false);
    });
  });

  describe('canDeclineRequest', () => {
    it('returns true when request is pending and user is item owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
      });
      expect(canDeclineRequest(request, ownerId, ownerId)).toBe(true);
    });

    it('returns false when request is not pending', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      expect(canDeclineRequest(request, ownerId, ownerId)).toBe(false);
    });

    it('returns false when user is not the item owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
      });
      expect(canDeclineRequest(request, requesterId, ownerId)).toBe(false);
    });
  });

  describe('canCancelRequest', () => {
    it('returns true when request is pending and user is the requester', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
        requesterId,
      });
      expect(canCancelRequest(request, requesterId)).toBe(true);
    });

    it('returns true when request is accepted and user is the requester', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
        requesterId,
      });
      expect(canCancelRequest(request, requesterId)).toBe(true);
    });

    it('returns false when request is picked up', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.PickedUp,
        requesterId,
      });
      expect(canCancelRequest(request, requesterId)).toBe(false);
    });

    it('returns false when request is returned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Returned,
        requesterId,
      });
      expect(canCancelRequest(request, requesterId)).toBe(false);
    });

    it('returns false when request is rejected', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Rejected,
        requesterId,
      });
      expect(canCancelRequest(request, requesterId)).toBe(false);
    });

    it('returns false when request is cancelled', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Cancelled,
        requesterId,
      });
      expect(canCancelRequest(request, requesterId)).toBe(false);
    });

    it('returns false when user is not the requester (pending)', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
        requesterId,
      });
      expect(canCancelRequest(request, ownerId)).toBe(false);
    });

    it('returns false when user is not the requester (accepted)', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
        requesterId,
      });
      expect(canCancelRequest(request, ownerId)).toBe(false);
    });
  });

  describe('canMarkPickedUp', () => {
    it('returns true when request is accepted, item is reserved, and user is the owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(true);
    });

    it('returns false when request is pending', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(false);
    });

    it('returns false when request is picked up', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.PickedUp,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(false);
    });

    it('returns false when request is returned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Returned,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(false);
    });

    it('returns false when request is rejected', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Rejected,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(false);
    });

    it('returns false when request is cancelled', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Cancelled,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(false);
    });

    it('returns false when item is stored (not reserved)', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Stored,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(false);
    });

    it('returns false when item is loaned (not reserved)', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, ownerId)).toBe(false);
    });

    it('returns false when user is not the owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkPickedUp(request, item, requesterId)).toBe(false);
    });
  });

  describe('canMarkReturned', () => {
    it('returns true when request is picked up and item is Loaned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.PickedUp,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(true);
    });

    it('returns false when request is not picked up', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(false);
    });

    it('returns false when request is accepted but item is still reserved (regression)', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(false);
    });

    it('returns false when request is accepted even if item is loaned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(false);
    });

    it('returns false when item is not Loaned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.PickedUp,
      });
      const item = createMockItem({
        status: ItemStatus.Stored,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(false);
    });

    it('returns false when user is not the item owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.PickedUp,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkReturned(request, item, requesterId)).toBe(false);
    });
  });

  describe('getRequestActions', () => {
    it('returns accept and decline for pending requests when user is owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
        requesterId,
      });
      const actions = getRequestActions(request, ownerId, ownerId);
      expect(actions).toEqual(['accept', 'decline']);
    });

    it('returns cancel for outgoing pending requests (requester)', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
        requesterId,
      });
      const actions = getRequestActions(request, requesterId, ownerId);
      expect(actions).toContain('cancel');
      expect(actions).not.toContain('accept');
      expect(actions).not.toContain('decline');
    });

    it('returns markPickedUp for accepted requests when user is owner and item is reserved', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
        requesterId,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      const actions = getRequestActions(request, ownerId, ownerId, item);
      expect(actions).toContain('markPickedUp');
      expect(actions).not.toContain('markReturned');
    });

    it('returns cancel for accepted requests when user is requester', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
        requesterId,
      });
      const item = createMockItem({
        status: ItemStatus.Reserved,
        ownerId,
      });
      const actions = getRequestActions(request, requesterId, ownerId, item);
      expect(actions).toContain('cancel');
      expect(actions).not.toContain('markPickedUp');
      expect(actions).not.toContain('markReturned');
    });

    it('returns markReturned for picked up requests when user is owner and item is loaned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.PickedUp,
        requesterId,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      const actions = getRequestActions(request, ownerId, ownerId, item);
      expect(actions).toContain('markReturned');
      expect(actions).not.toContain('markPickedUp');
    });

    it('returns empty array for picked up requests when user is requester', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.PickedUp,
        requesterId,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      const actions = getRequestActions(request, requesterId, ownerId, item);
      expect(actions).toHaveLength(0);
    });

    it('returns empty array for returned requests', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Returned,
        requesterId,
      });
      const actions = getRequestActions(request, ownerId, ownerId);
      expect(actions).toHaveLength(0);
    });

    it('returns empty array for cancelled requests', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Cancelled,
        requesterId,
      });
      const actions = getRequestActions(request, requesterId, ownerId);
      expect(actions).toHaveLength(0);
    });

    it('returns empty array for rejected requests', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Rejected,
        requesterId,
      });
      const actions = getRequestActions(request, ownerId, ownerId);
      expect(actions).toHaveLength(0);
    });
  });
});
