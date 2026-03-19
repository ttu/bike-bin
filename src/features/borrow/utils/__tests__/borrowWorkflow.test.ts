import {
  canRequestBorrow,
  canAcceptRequest,
  canDeclineRequest,
  canCancelRequest,
  canMarkReturned,
  getRequestActions,
} from '../borrowWorkflow';
import { createMockItem, createMockBorrowRequest } from '@/test/factories';
import { ItemStatus, AvailabilityType, BorrowRequestStatus } from '@/shared/types';
import type { UserId } from '@/shared/types';

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

    it('returns false when request is not pending', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
        requesterId,
      });
      expect(canCancelRequest(request, requesterId)).toBe(false);
    });

    it('returns false when user is not the requester', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
        requesterId,
      });
      expect(canCancelRequest(request, ownerId)).toBe(false);
    });
  });

  describe('canMarkReturned', () => {
    it('returns true when request is accepted and item is Loaned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(true);
    });

    it('returns false when request is not accepted', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(false);
    });

    it('returns false when item is not Loaned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Stored,
        ownerId,
      });
      expect(canMarkReturned(request, item, ownerId)).toBe(false);
    });

    it('returns false when user is not the item owner', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      expect(canMarkReturned(request, item, requesterId)).toBe(false);
    });
  });

  describe('getRequestActions', () => {
    it('returns accept and decline for incoming pending requests', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
        requesterId,
      });
      const actions = getRequestActions(request, ownerId, ownerId);
      expect(actions).toContain('accept');
      expect(actions).toContain('decline');
      expect(actions).not.toContain('cancel');
      expect(actions).not.toContain('markReturned');
    });

    it('returns cancel for outgoing pending requests', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Pending,
        requesterId,
      });
      const actions = getRequestActions(request, requesterId, ownerId);
      expect(actions).toContain('cancel');
      expect(actions).not.toContain('accept');
      expect(actions).not.toContain('decline');
    });

    it('returns markReturned for accepted requests when user is owner and item is Loaned', () => {
      const request = createMockBorrowRequest({
        status: BorrowRequestStatus.Accepted,
        requesterId,
      });
      const item = createMockItem({
        status: ItemStatus.Loaned,
        ownerId,
      });
      const actions = getRequestActions(request, ownerId, ownerId, item);
      expect(actions).toContain('markReturned');
    });

    it('returns empty array for completed requests', () => {
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
