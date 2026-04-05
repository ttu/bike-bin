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
  const { data: bikes, isLoading: bikesLoading } = useBikes();
  const { data: limit, isLoading: limitLoading } = useMyBikeLimit();

  if (!isAuthenticated || !user) {
    return {
      atLimit: false,
      bikeRowCount: 0,
      limit: undefined,
      isReady: true,
    };
  }

  const bikeRowCount = bikes?.length ?? 0;
  const isReady = !bikesLoading && !limitLoading && limit !== undefined;
  const atLimit = isReady && limit !== undefined && bikeRowCount >= limit;

  return {
    atLimit,
    bikeRowCount,
    limit,
    isReady,
  };
}
