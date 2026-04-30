import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';

const ITEM_PHOTOS_BUCKET = 'item-photos';

export interface UseRemoveEntityPhotoConfig<TEntityId extends string> {
  /** Photos table to delete from. */
  table: 'item_photos' | 'bike_photos';
  /**
   * Query keys to invalidate on success. The hook also appends
   * `['photo-row-capacity', userId]` automatically.
   */
  invalidationKeys: (entityId: TEntityId, userId: string) => readonly unknown[][];
}

export interface RemoveEntityPhotoParams<TEntityId extends string> {
  entityId: TEntityId;
  photoId: string;
  storagePath: string;
}

/**
 * Generic "remove a photo" mutation for inventory items and bikes.
 * Deletes the storage object first, then the photo row, then invalidates
 * caller-specified query keys plus the shared photo-row-capacity counter.
 */
export function useRemoveEntityPhoto<TEntityId extends string>(
  config: UseRemoveEntityPhotoConfig<TEntityId>,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ photoId, storagePath }: RemoveEntityPhotoParams<TEntityId>) => {
      const { error: storageError } = await supabase.storage
        .from(ITEM_PHOTOS_BUCKET)
        .remove([storagePath]);
      if (storageError) throw storageError;

      const { error } = await supabase.from(config.table).delete().eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: (_data, { entityId }) => {
      if (!user) return;
      for (const key of config.invalidationKeys(entityId, user.id)) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      queryClient.invalidateQueries({ queryKey: ['photo-row-capacity', user.id] });
    },
  });
}
