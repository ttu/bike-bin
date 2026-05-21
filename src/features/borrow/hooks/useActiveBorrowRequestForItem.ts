import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { fetchPublicProfilesMap } from '@/shared/api/fetchPublicProfile';
import {
  BorrowRequestStatus,
  type AvailabilityType,
  type BorrowRequestId,
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
        availability_types: string[];
      } | null;

      const ownerId = item?.owner_id ?? '';
      const profileMap = await fetchPublicProfilesMap([data.requester_id as string, ownerId]);
      const requesterProfile = profileMap.get(data.requester_id as string);
      const ownerProfile = profileMap.get(ownerId);

      return {
        id: data.id as BorrowRequestId,
        itemId: data.item_id as ItemId,
        requesterId: data.requester_id as UserId,
        status: data.status as BorrowRequestStatus,
        message: (data.message as string) ?? undefined,
        actedBy: (data.acted_by as UserId | null) ?? undefined,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
        itemName: item?.name ?? 'Unknown item',
        itemStatus: (item?.status ?? 'stored') as ItemStatus,
        itemOwnerId: ownerId as UserId,
        itemAvailabilityTypes: (item?.availability_types as AvailabilityType[]) ?? [],
        requesterName: requesterProfile?.displayName,
        requesterAvatarUrl: requesterProfile?.avatarUrl,
        ownerName: ownerProfile?.displayName,
        ownerAvatarUrl: ownerProfile?.avatarUrl,
      };
    },
    enabled: itemId !== undefined && options.enabled,
  });
}
