import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { Item, ItemPhoto } from '@/shared/types';
import type { ItemId } from '@/shared/types';
import { ItemStatus } from '@/shared/types';
import { canDelete } from '../utils/status';
import type { ItemFormData } from '../utils/validation';

export function useItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Item[];
    },
    enabled: !!user,
  });
}

export function useItem(id: ItemId) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('*').eq('id', id).single();

      if (error) throw error;
      return data as Item;
    },
    enabled: !!id,
  });
}

export function useItemPhotos(itemId: ItemId) {
  return useQuery({
    queryKey: ['item_photos', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_photos')
        .select('*')
        .eq('item_id', itemId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ItemPhoto[];
    },
    enabled: !!itemId,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: ItemFormData) => {
      const { data, error } = await supabase
        .from('items')
        .insert({
          owner_id: user!.id,
          name: formData.name,
          category: formData.category,
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
          purchase_date: formData.purchaseDate,
          pickup_location_id: formData.pickupLocationId,
          visibility: formData.visibility ?? 'all',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: ItemFormData & { id: ItemId }) => {
      const { data, error } = await supabase
        .from('items')
        .update({
          name: formData.name,
          category: formData.category,
          condition: formData.condition,
          brand: formData.brand,
          model: formData.model,
          description: formData.description,
          availability_types: formData.availabilityTypes,
          price: formData.price,
          deposit: formData.deposit,
          borrow_duration: formData.borrowDuration,
          storage_location: formData.storageLocation,
          age: formData.age,
          usage_km: formData.usageKm,
          purchase_date: formData.purchaseDate,
          pickup_location_id: formData.pickupLocationId,
          visibility: formData.visibility,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Item;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', variables.id] });
    },
  });
}

export function useUpdateItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: ItemId; status: ItemStatus }) => {
      const { data, error } = await supabase
        .from('items')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Item;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', variables.id] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: ItemId; status: ItemStatus }) => {
      if (!canDelete({ status })) {
        throw new Error('Cannot delete item with status: ' + status);
      }

      const { error } = await supabase.from('items').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
