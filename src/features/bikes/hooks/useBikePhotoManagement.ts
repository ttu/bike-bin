import { useRemoveEntityPhoto } from '@/shared/hooks/useRemoveEntityPhoto';
import type { BikeId } from '@/shared/types';

interface RemoveBikePhotoParams {
  bikeId: BikeId;
  photoId: string;
  storagePath: string;
}

/**
 * Thin wrapper around `useRemoveEntityPhoto` that preserves the historical
 * `{bikeId, photoId, storagePath}` parameter shape for existing callers.
 */
export function useRemoveBikePhoto() {
  const inner = useRemoveEntityPhoto<BikeId>({
    table: 'bike_photos',
    invalidationKeys: (bikeId, userId) => [
      ['bike_photos', bikeId],
      ['bikes', userId],
    ],
  });

  return {
    ...inner,
    mutate: (
      { bikeId, photoId, storagePath }: RemoveBikePhotoParams,
      options?: Parameters<typeof inner.mutate>[1],
    ) => inner.mutate({ entityId: bikeId, photoId, storagePath }, options),
    mutateAsync: (
      { bikeId, photoId, storagePath }: RemoveBikePhotoParams,
      options?: Parameters<typeof inner.mutateAsync>[1],
    ) => inner.mutateAsync({ entityId: bikeId, photoId, storagePath }, options),
  };
}
