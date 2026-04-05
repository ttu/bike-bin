import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';

/** Max item rows for the signed-in user (from DB subscription rules). */
export function useMyInventoryItemLimit() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['inventory-item-limit', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_inventory_item_limit');
      if (error) {
        throw error;
      }
      if (data === null || data === undefined) {
        throw new Error('get_my_inventory_item_limit returned empty');
      }
      return data;
    },
    enabled: !!user,
  });
}
