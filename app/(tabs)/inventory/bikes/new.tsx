import { useCallback } from 'react';
import { router } from 'expo-router';
import { useCreateBike } from '@/features/bikes';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';

export default function NewBikeScreen() {
  const createBike = useCreateBike();

  const handleSave = useCallback(
    (data: BikeFormData) => {
      createBike.mutate(data, {
        onSuccess: () => {
          router.back();
        },
      });
    },
    [createBike],
  );

  return <BikeForm onSave={handleSave} isSubmitting={createBike.isPending} />;
}
