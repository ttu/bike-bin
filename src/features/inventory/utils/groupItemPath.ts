import type { Item } from '@/shared/types';

/**
 * Returns the storage path prefix segment for an item's photos.
 *
 * - Personal items: the owner's user id
 * - Group items: `group-<groupId>`
 *
 * The returned value is placed between `items/` and `/<itemId>/` in the
 * storage path so that RLS policies can distinguish personal vs group uploads
 * based on `storage.foldername(name)[2]`.
 */
export function getItemPhotoPathPrefix(item: Pick<Item, 'ownerId' | 'groupId'>): string {
  if (item.groupId !== undefined) return `group-${item.groupId}`;
  if (item.ownerId !== undefined) return item.ownerId;
  throw new Error('Item has neither ownerId nor groupId');
}
