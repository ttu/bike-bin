import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { BorrowRequestId, ItemId, UserId } from '@/shared/types';
import { BorrowRequestStatus } from '@/shared/types';
import type { ItemStatus, AvailabilityType } from '@/shared/types';
import type { BorrowRequestWithDetails } from '../types';

export const BORROW_REQUESTS_QUERY_KEY = 'borrowRequests';

export function useBorrowRequests() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [BORROW_REQUESTS_QUERY_KEY, userId],
    queryFn: async (): Promise<BorrowRequestWithDetails[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('borrow_requests')
        .select(
          `
          id,
          item_id,
          requester_id,
          status,
          message,
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Collect unique user IDs for profile lookups
      const userIds = new Set<string>();
      for (const row of data) {
        userIds.add(row.requester_id as string);
        const item = (Array.isArray(row.items) ? row.items[0] : row.items) as {
          owner_id: string;
        } | null;
        if (item) {
          userIds.add(item.owner_id);
        }
      }

      // Fetch all profiles in one query
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(userIds));

      const profileMap = new Map<
        string,
        { display_name: string | null; avatar_url: string | null }
      >();
      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id as string, {
            display_name: p.display_name as string | null,
            avatar_url: p.avatar_url as string | null,
          });
        }
      }

      return data.map((row) => {
        const item = (Array.isArray(row.items) ? row.items[0] : row.items) as {
          id: string;
          name: string;
          status: string;
          owner_id: string;
          availability_types: string[];
        } | null;

        const requesterProfile = profileMap.get(row.requester_id as string);
        const ownerProfile = item ? profileMap.get(item.owner_id) : undefined;

        return {
          id: row.id as BorrowRequestId,
          itemId: row.item_id as ItemId,
          requesterId: row.requester_id as UserId,
          status: row.status as BorrowRequestStatus,
          message: (row.message as string) ?? undefined,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          itemName: item?.name ?? 'Unknown item',
          itemStatus: (item?.status ?? 'stored') as ItemStatus,
          itemOwnerId: (item?.owner_id ?? '') as UserId,
          itemAvailabilityTypes: (item?.availability_types as AvailabilityType[]) ?? [],
          requesterName: requesterProfile?.display_name ?? undefined,
          requesterAvatarUrl: requesterProfile?.avatar_url ?? undefined,
          ownerName: ownerProfile?.display_name ?? undefined,
          ownerAvatarUrl: ownerProfile?.avatar_url ?? undefined,
        };
      });
    },
    enabled: !!userId,
  });
}
