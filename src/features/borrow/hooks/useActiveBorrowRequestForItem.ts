import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { fetchPublicProfilesMap } from '@/shared/api/fetchPublicProfile';
import {
  BorrowRequestStatus,
  type AvailabilityType,
  type BorrowRequestId,
  type GroupId,
  type ItemId,
  type ItemStatus,
  type UserId,
} from '@/shared/types';
import type { BorrowRequestWithDetails } from '../types';

/** Query key for the "active borrow request for this item" lookup. */
export const ACTIVE_BORROW_REQUEST_FOR_ITEM_QUERY_KEY = 'activeBorrowRequestForItem' as const;

const ACTIVE_STATUSES = [BorrowRequestStatus.Pending, BorrowRequestStatus.Accepted];

/**
 * Returns the single live (non-terminal) borrow request for a given item, or null.
 * Live means the request is Pending or Accepted — i.e. it still needs
 * action from someone. Used by the chat-thread actions banner.
 */
export function useActiveBorrowRequestForItem(
  itemId: ItemId | undefined,
  options: { enabled: boolean } = { enabled: true },
) {
  return useQuery({
    queryKey: [ACTIVE_BORROW_REQUEST_FOR_ITEM_QUERY_KEY, itemId],
    queryFn: async (): Promise<BorrowRequestWithDetails | null> => {
      if (!itemId) return null;

      const { data, error } = await supabase
        .from('borrow_requests')
        .select(
          `
          id,
          item_id,
          requester_id,
          status,
          message,
          acted_by,
          created_at,
          updated_at,
          items (
            id,
            name,
            status,
            owner_id,
            group_id,
            availability_types
          )
        `,
        )
        .eq('item_id', itemId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const item = (Array.isArray(data.items) ? data.items[0] : data.items) as {
        id: string;
        name: string;
        status: string;
        owner_id: string;
        group_id: string | null;
        availability_types: string[];
      } | null;

      // If the item was deleted but the request row lingers, suppress the banner
      // rather than fabricate `itemName: 'Unknown item'` / empty-string branded IDs.
      if (!item) return null;

      const profileIds = [data.requester_id as string, item.owner_id].filter(
        (id): id is string => id.length > 0,
      );
      const profileMap = await fetchPublicProfilesMap(profileIds);
      const requesterProfile = profileMap.get(data.requester_id as string);
      const ownerProfile = profileMap.get(item.owner_id);

      return {
        id: data.id as BorrowRequestId,
        itemId: data.item_id as ItemId,
        requesterId: data.requester_id as UserId,
        status: data.status as BorrowRequestStatus,
        message: (data.message as string) ?? undefined,
        actedBy: (data.acted_by as UserId | null) ?? undefined,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
        itemName: item.name,
        itemStatus: item.status as ItemStatus,
        itemOwnerId: item.owner_id as UserId,
        itemGroupId: (item.group_id ?? undefined) as GroupId | undefined,
        itemAvailabilityTypes: item.availability_types as AvailabilityType[],
        requesterName: requesterProfile?.displayName,
        requesterAvatarUrl: requesterProfile?.avatarUrl,
        ownerName: ownerProfile?.displayName,
        ownerAvatarUrl: ownerProfile?.avatarUrl,
      };
    },
    enabled: itemId !== undefined && options.enabled,
  });
}
