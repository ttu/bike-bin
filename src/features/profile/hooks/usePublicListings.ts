import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { ItemId } from '@/shared/types';
import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { PublicListing } from '../types';

export function usePublicListings(userId: string | undefined) {
  return useQuery({
    queryKey: ['publicListings', userId],
    queryFn: async (): Promise<PublicListing[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, category, condition, availability_types, price, created_at')
        .eq('owner_id', userId!)
        .eq('visibility', 'public')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id as string as ItemId,
        name: row.name as string,
        category: row.category as ItemCategory,
        condition: row.condition as ItemCondition,
        availabilityTypes: (row.availability_types ?? []) as AvailabilityType[],
        price: (row.price as number) ?? undefined,
        createdAt: row.created_at as string,
      }));
    },
    enabled: !!userId,
  });
}
