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
      const { data, error } = await supabase.from('items').select('*').eq('id', id!).single();

      if (error) throw error;

      // Fetch owner profile
      const { data: owner } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, rating_avg, rating_count')
        .eq('id', data.owner_id)
        .single();

      // Fetch location area name
      let areaName: string | undefined;
      if (data.pickup_location_id) {
        const { data: loc } = await supabase
          .from('saved_locations')
          .select('area_name')
          .eq('id', data.pickup_location_id)
          .single();
        areaName = (loc?.area_name as string) ?? undefined;
      }

      return {
        id: data.id as ItemId,
        ownerId: data.owner_id as UserId,
        name: data.name as string,
        category: data.category as ItemCategory,
        brand: (data.brand as string) ?? undefined,
        model: (data.model as string) ?? undefined,
        description: (data.description as string) ?? undefined,
        condition: data.condition as ItemCondition,
        availabilityTypes: (data.availability_types ?? []) as AvailabilityType[],
        price: (data.price as number) ?? undefined,
        deposit: (data.deposit as number) ?? undefined,
        borrowDuration: (data.borrow_duration as string) ?? undefined,
        visibility: data.visibility as string,
        pickupLocationId: (data.pickup_location_id as LocationId) ?? undefined,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
        distanceMeters: undefined,
        ownerDisplayName: (owner?.display_name as string) ?? undefined,
        ownerAvatarUrl: (owner?.avatar_url as string) ?? undefined,
        ownerRatingAvg: (owner?.rating_avg as number) ?? 0,
        ownerRatingCount: (owner?.rating_count as number) ?? 0,
        areaName,
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
