import {
  useStagedEntityPhotos,
  type UseStagedEntityPhotosReturn,
} from '@/shared/hooks/useStagedEntityPhotos';
import type { BikeId } from '@/shared/types';

export function useStagedBikePhotos(): UseStagedEntityPhotosReturn<BikeId> {
  return useStagedEntityPhotos<BikeId>({
    pathPrefix: 'bikes',
    table: 'bike_photos',
    entityIdColumn: 'bike_id',
    invalidationKeys: (bikeId, userId) => [
      ['bike_photos', bikeId],
      ['bikes', bikeId],
      ['bikes', userId],
    ],
  });
}
