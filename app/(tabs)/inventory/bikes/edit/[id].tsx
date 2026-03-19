import { useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import type { BikeId } from '@/shared/types';
import { useBike, useUpdateBike, useDeleteBike } from '@/features/bikes';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';

export default function EditBikeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bikeId = id as BikeId;

  const { data: bike } = useBike(bikeId);
  const updateBike = useUpdateBike();
  const deleteBike = useDeleteBike();

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
      onSave={handleSave}
      onDelete={handleDelete}
      isSubmitting={updateBike.isPending}
    />
  );
}
