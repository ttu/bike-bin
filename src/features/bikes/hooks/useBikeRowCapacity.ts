import { useAuth } from '@/features/auth';
import { useBikes } from './useBikes';
import { useMyBikeLimit } from './useMyBikeLimit';

export type BikeRowCapacity = {
  atLimit: boolean;
  bikeRowCount: number;
  limit: number | undefined;
  isReady: boolean;
};

export function useBikeRowCapacity(): BikeRowCapacity {
  const { isAuthenticated, user } = useAuth();
  const { data: bikes, isLoading: bikesLoading, isError: bikesError } = useBikes();
  const { data: limit, isLoading: limitLoading } = useMyBikeLimit();

  if (!isAuthenticated || !user) {
    return {
      atLimit: false,
      bikeRowCount: 0,
      limit: undefined,
      isReady: true,
    };
  }

  const bikesResolved = !bikesLoading && !bikesError && bikes !== undefined;
  const bikeRowCount = bikesResolved ? bikes.length : 0;
  const isReady = bikesResolved && !limitLoading && limit !== undefined;
  const atLimit = isReady && bikeRowCount >= limit;

  return {
    atLimit,
    bikeRowCount,
    limit,
    isReady,
  };
}
