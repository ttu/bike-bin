import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { ItemId } from '@/shared/types';

interface SwapPhotoOrderParams {
  itemId: ItemId;
  photoIdA: string;
  sortOrderA: number;
  photoIdB: string;
  sortOrderB: number;
}

export function useSwapItemPhotoOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ photoIdA, sortOrderA, photoIdB, sortOrderB }: SwapPhotoOrderParams) => {
      const { error: errorA } = await supabase
        .from('item_photos')
        .update({ sort_order: sortOrderB })
        .eq('id', photoIdA);
      if (errorA) throw errorA;

      const { error: errorB } = await supabase
        .from('item_photos')
        .update({ sort_order: sortOrderA })
        .eq('id', photoIdB);
      if (errorB) throw errorB;
    },
    onSuccess: (_data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items', user!.id] });
    },
  });
}

interface RemoveItemPhotoParams {
  itemId: ItemId;
  photoId: string;
  storagePath: string;
}

export function useRemoveItemPhoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ photoId, storagePath }: RemoveItemPhotoParams) => {
      await supabase.storage.from('item-photos').remove([storagePath]);

      const { error } = await supabase.from('item_photos').delete().eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: (_data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items', user!.id] });
    },
  });
}
