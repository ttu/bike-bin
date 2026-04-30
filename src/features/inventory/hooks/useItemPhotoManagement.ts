import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { useRemoveEntityPhoto } from '@/shared/hooks/useRemoveEntityPhoto';
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
      queryClient.invalidateQueries({ queryKey: ['items', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items', user!.id] });
    },
  });
}

interface RemoveItemPhotoParams {
  itemId: ItemId;
  photoId: string;
  storagePath: string;
}

/**
 * Thin wrapper around `useRemoveEntityPhoto` that preserves the historical
 * `{itemId, photoId, storagePath}` parameter shape for existing callers.
 */
export function useRemoveItemPhoto() {
  const inner = useRemoveEntityPhoto<ItemId>({
    table: 'item_photos',
    invalidationKeys: (itemId, userId) => [
      ['item_photos', itemId],
      ['items', itemId],
      ['items', userId],
    ],
  });

  return {
    ...inner,
    mutate: (
      { itemId, photoId, storagePath }: RemoveItemPhotoParams,
      options?: Parameters<typeof inner.mutate>[1],
    ) => inner.mutate({ entityId: itemId, photoId, storagePath }, options),
    mutateAsync: (
      { itemId, photoId, storagePath }: RemoveItemPhotoParams,
      options?: Parameters<typeof inner.mutateAsync>[1],
    ) => inner.mutateAsync({ entityId: itemId, photoId, storagePath }, options),
  };
}
