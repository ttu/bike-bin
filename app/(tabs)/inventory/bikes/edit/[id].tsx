import { useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import type { BikeId } from '@/shared/types';
import {
  useBike,
  useBikePhotos,
  useUpdateBike,
  useDeleteBike,
  useBikePhotoUpload,
} from '@/features/bikes';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';
import { supabase } from '@/shared/api/supabase';
import { useQueryClient } from '@tanstack/react-query';

export default function EditBikeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bikeId = id as BikeId;

  const { data: bike } = useBike(bikeId);
  const { data: photos = [] } = useBikePhotos(bikeId);
  const updateBike = useUpdateBike();
  const deleteBike = useDeleteBike();
  const { pickAndUpload, isUploading } = useBikePhotoUpload();
  const queryClient = useQueryClient();

  const handleSave = useCallback(
    (data: BikeFormData) => {
      updateBike.mutate(
        { id: bikeId, ...data },
        {
          onSuccess: () => {
            router.back();
          },
        },
      );
    },
    [updateBike, bikeId],
  );

  const handleAddPhoto = useCallback(() => {
    pickAndUpload(bikeId);
  }, [pickAndUpload, bikeId]);

  const handleRemovePhoto = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (photo) {
        await supabase.storage.from('item-photos').remove([photo.storagePath]);
        await supabase.from('bike_photos').delete().eq('id', photoId);
        queryClient.invalidateQueries({ queryKey: ['bike_photos', bikeId] });
        queryClient.invalidateQueries({ queryKey: ['bikes'] });
      }
    },
    [photos, bikeId, queryClient],
  );

  const handleDelete = useCallback(() => {
    deleteBike.mutate(bikeId, {
      onSuccess: () => {
        router.navigate('/(tabs)/inventory/bikes' as never);
      },
    });
  }, [deleteBike, bikeId]);

  if (!bike) return null;

  return (
    <BikeForm
      initialData={{
        name: bike.name,
        brand: bike.brand ?? undefined,
        model: bike.model ?? undefined,
        type: bike.type,
        year: bike.year ?? undefined,
      }}
      bikeId={bikeId}
      photos={photos}
      onAddPhoto={handleAddPhoto}
      onRemovePhoto={handleRemovePhoto}
      isUploadingPhoto={isUploading}
      onSave={handleSave}
      onDelete={handleDelete}
      isSubmitting={updateBike.isPending}
    />
  );
}
