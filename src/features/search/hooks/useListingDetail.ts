import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { mapItemPhotoRow } from '@/shared/utils/mapItemRow';
import type { ItemId, UserId, LocationId } from '@/shared/types';
import type { ItemCategory, ItemCondition, AvailabilityType, ItemPhoto } from '@/shared/types';
import type { SearchResultItem } from '../types';

export function useListingDetail(id: string | undefined) {
  const itemQuery = useQuery({
    queryKey: ['listing', id],
    queryFn: async (): Promise<SearchResultItem> => {
      const { data, error } = await supabase.rpc('get_listing_detail', { p_item_id: id! }).single();

      if (error) throw error;

      const row = data as Record<string, unknown>;

      return {
        id: row.id as ItemId,
        ownerId: row.owner_id as UserId,
        name: row.name as string,
        category: row.category as ItemCategory,
        brand: (row.brand as string) ?? undefined,
        model: (row.model as string) ?? undefined,
        description: (row.description as string) ?? undefined,
        condition: row.condition as ItemCondition,
        quantity: typeof row.quantity === 'number' && row.quantity >= 1 ? row.quantity : 1,
        availabilityTypes: (row.availability_types ?? []) as AvailabilityType[],
        price: (row.price as number) ?? undefined,
        deposit: (row.deposit as number) ?? undefined,
        borrowDuration: (row.borrow_duration as string) ?? undefined,
        visibility: row.visibility as string,
        pickupLocationId: (row.pickup_location_id as LocationId) ?? undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        distanceMeters: (row.distance_meters as number) ?? undefined,
        ownerDisplayName: (row.owner_display_name as string) ?? undefined,
        ownerAvatarUrl: (row.owner_avatar_url as string) ?? undefined,
        ownerRatingAvg: (row.owner_rating_avg as number) ?? 0,
        ownerRatingCount: (row.owner_rating_count as number) ?? 0,
        areaName: (row.area_name as string) ?? undefined,
        thumbnailStoragePath: undefined,
      };
    },
    enabled: !!id,
  });

  const photosQuery = useQuery({
    queryKey: ['item_photos', id],
    queryFn: async (): Promise<ItemPhoto[]> => {
      const { data, error } = await supabase
        .from('item_photos')
        .select('*')
        .eq('item_id', id!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) => mapItemPhotoRow(row as Record<string, unknown>));
    },
    enabled: !!id,
  });

  return {
    item: itemQuery.data,
    photos: photosQuery.data ?? [],
    isLoading: itemQuery.isLoading,
  };
}
