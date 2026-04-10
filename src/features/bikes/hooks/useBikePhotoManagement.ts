import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { BikeId } from '@/shared/types';

interface RemoveBikePhotoParams {
  bikeId: BikeId;
  photoId: string;
  storagePath: string;
}

export function useRemoveBikePhoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ photoId, storagePath }: RemoveBikePhotoParams) => {
      await supabase.storage.from('item-photos').remove([storagePath]);

      const { error } = await supabase.from('bike_photos').delete().eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: (_data, { bikeId }) => {
      queryClient.invalidateQueries({ queryKey: ['bike_photos', bikeId] });
      queryClient.invalidateQueries({ queryKey: ['bikes', user!.id] });
    },
  });
}
