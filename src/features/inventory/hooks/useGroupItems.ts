import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { ItemCategory, ItemStatus, type GroupId } from '@/shared/types';
import { mapItemRow } from '@/shared/utils/mapItemRow';
import { fetchFirstPhotoPaths } from '@/shared/utils/fetchFirstPhotoPaths';
import type { ItemFormData } from '../utils/validation';

export function useGroupItems(groupId: GroupId | undefined) {
  return useQuery({
    queryKey: ['group-items', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('group_id', groupId!)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const items = (data ?? []).map((row) => mapItemRow(row));

      const thumbMap = await fetchFirstPhotoPaths({
        table: 'item_photos',
        idColumn: 'item_id',
        ids: items.map((i) => i.id),
      });
      return items.map((item) => ({
        ...item,
        thumbnailStoragePath: thumbMap.get(item.id),
      }));
    },
    enabled: !!groupId,
  });
}

export function useCreateGroupItem(groupId: GroupId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: ItemFormData) => {
      const { data, error } = await supabase
        .from('items')
        .insert({
          owner_id: null,
          group_id: groupId,
          created_by: user!.id,
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory,
          condition: formData.condition,
          brand: formData.brand,
          model: formData.model,
          description: formData.description,
          status: ItemStatus.Stored,
          availability_types: formData.availabilityTypes,
          price: formData.price,
          deposit: formData.deposit,
          borrow_duration: formData.borrowDuration,
          storage_location: formData.storageLocation,
          age: formData.age,
          usage_km: formData.usageKm,
          remaining_fraction:
            formData.category === ItemCategory.Consumable ? formData.remainingFraction : null,
          purchase_date: formData.purchaseDate,
          mounted_date: formData.mountedDate,
          pickup_location_id: formData.pickupLocationId,
          // Group items default to 'groups' visibility so all members can see them.
          // Admins can still flip this to 'all' (publicly listable) via the form;
          // 'private' is not a meaningful state for group-owned items, so we skip it as a default.
          visibility: formData.visibility ?? 'groups',
          tags: formData.tags ?? [],
          quantity: formData.quantity ?? 1,
        })
        .select()
        .single();

      if (error) throw error;
      return mapItemRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-items', groupId] });
      queryClient.invalidateQueries({ queryKey: ['user-tags'] });
    },
  });
}
