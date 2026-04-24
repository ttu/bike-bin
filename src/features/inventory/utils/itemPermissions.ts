import type { Item } from '@/shared/types';
import { GroupRole, ItemStatus } from '@/shared/types';

/**
 * Item statuses that represent an active borrow lifecycle.
 * Items in these states cannot be deleted or transferred.
 */
const ACTIVE_BORROW_STATUSES = new Set<ItemStatus>([ItemStatus.Loaned, ItemStatus.Reserved]);

/**
 * Whether the viewer can edit this item's core fields.
 * - Personal items: only the owner.
 * - Group items: only group admins.
 */
export function canEditItem(
  item: Pick<Item, 'ownerId' | 'groupId'>,
  userId: string,
  groupRole: GroupRole | undefined,
): boolean {
  if (item.ownerId !== undefined) return item.ownerId === userId;
  if (item.groupId !== undefined) return groupRole === GroupRole.Admin;
  return false;
}

/**
 * Whether the viewer can delete this item.
 * Items currently out on loan or reserved cannot be deleted; otherwise
 * delegates to `canEditItem`.
 */
export function canDeleteItem(
  item: Pick<Item, 'ownerId' | 'groupId' | 'status'>,
  userId: string,
  groupRole: GroupRole | undefined,
): boolean {
  if (ACTIVE_BORROW_STATUSES.has(item.status)) return false;
  return canEditItem(item, userId, groupRole);
}

/**
 * Whether the viewer can transfer this item between personal and group ownership.
 * Mirrors `canDeleteItem`: must be editable AND not in an active borrow state.
 */
export function canTransferItem(
  item: Pick<Item, 'ownerId' | 'groupId' | 'status'>,
  userId: string,
  groupRole: GroupRole | undefined,
): boolean {
  if (ACTIVE_BORROW_STATUSES.has(item.status)) return false;
  return canEditItem(item, userId, groupRole);
}

/**
 * Whether the viewer may request to borrow this item.
 * - Personal items: anyone except the owner.
 * - Group items: non-admin members (admins act on behalf of the group and
 *   cannot borrow from themselves).
 */
export function canBorrowItem(
  item: Pick<Item, 'ownerId' | 'groupId'>,
  userId: string,
  groupRole: GroupRole | undefined,
): boolean {
  if (item.ownerId !== undefined) return item.ownerId !== userId;
  if (item.groupId !== undefined) return groupRole !== GroupRole.Admin;
  return false;
}
