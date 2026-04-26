import {
  AvailabilityType,
  BorrowRequestStatus,
  ItemStatus,
  type BorrowRequest,
  type Item,
  type UserId,
} from '@/shared/types';

type BorrowableItem = Pick<Item, 'status' | 'availabilityTypes' | 'ownerId'>;
type RequestInfo = Pick<BorrowRequest, 'status' | 'requesterId'>;
type ReturnableItem = Pick<Item, 'status' | 'ownerId'>;

export type RequestAction = 'accept' | 'decline' | 'cancel' | 'markReturned';

/**
 * Whether a user can request to borrow this item.
 * True if item is Borrowable, Stored, and user is not the owner.
 */
export function canRequestBorrow(item: BorrowableItem, userId: UserId): boolean {
  return (
    item.status === ItemStatus.Stored &&
    item.availabilityTypes.includes(AvailabilityType.Borrowable) &&
    item.ownerId !== userId
  );
}

/**
 * Whether the current user can accept this borrow request.
 * True if request is Pending and user is the item owner.
 */
export function canAcceptRequest(
  request: RequestInfo,
  userId: UserId,
  itemOwnerId: UserId,
): boolean {
  return request.status === BorrowRequestStatus.Pending && userId === itemOwnerId;
}

/**
 * Whether the current user can decline this borrow request.
 * True if request is Pending and user is the item owner.
 */
export function canDeclineRequest(
  request: RequestInfo,
  userId: UserId,
  itemOwnerId: UserId,
): boolean {
  return request.status === BorrowRequestStatus.Pending && userId === itemOwnerId;
}

/**
 * Whether the current user can cancel this borrow request.
 * True if request is Pending and user is the requester.
 */
export function canCancelRequest(request: RequestInfo, userId: UserId): boolean {
  return request.status === BorrowRequestStatus.Pending && request.requesterId === userId;
}

/**
 * Whether the current user can mark the item as returned.
 * True if request is Accepted, item is Loaned, and user is the owner.
 */
export function canMarkReturned(
  request: RequestInfo,
  item: ReturnableItem,
  userId: UserId,
): boolean {
  return (
    request.status === BorrowRequestStatus.Accepted &&
    item.status === ItemStatus.Loaned &&
    item.ownerId === userId
  );
}

/**
 * Get available actions for a borrow request given the current user.
 */
export function getRequestActions(
  request: RequestInfo,
  userId: UserId,
  itemOwnerId: UserId,
  item?: ReturnableItem,
): RequestAction[] {
  const actions: RequestAction[] = [];

  if (canAcceptRequest(request, userId, itemOwnerId)) {
    actions.push('accept');
  }
  if (canDeclineRequest(request, userId, itemOwnerId)) {
    actions.push('decline');
  }
  if (canCancelRequest(request, userId)) {
    actions.push('cancel');
  }
  if (item && canMarkReturned(request, item, userId)) {
    actions.push('markReturned');
  }

  return actions;
}
