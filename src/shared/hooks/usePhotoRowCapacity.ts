import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';

export type PhotoRowCapacity = {
  atLimit: boolean;
  photoRowCount: number;
  limit: number | undefined;
  isReady: boolean;
};

/** Combined item_photos + bike_photos row count vs subscription cap. */
export function usePhotoRowCapacity(): PhotoRowCapacity {
  const { isAuthenticated, user } = useAuth();

  const query = useQuery({
    queryKey: ['photo-row-capacity', user?.id],
    queryFn: async () => {
      const [limRes, cntRes] = await Promise.all([
        supabase.rpc('get_my_photo_limit'),
        supabase.rpc('get_my_photo_count'),
      ]);
      if (limRes.error) {
        throw limRes.error;
      }
      if (cntRes.error) {
        throw cntRes.error;
      }
      if (limRes.data === null || limRes.data === undefined) {
        throw new Error('get_my_photo_limit returned empty');
      }
      if (cntRes.data === null || cntRes.data === undefined) {
        throw new Error('get_my_photo_count returned empty');
      }
      return { limit: limRes.data, count: cntRes.data };
    },
    enabled: isAuthenticated && !!user,
  });

  if (!isAuthenticated || !user) {
    return {
      atLimit: false,
      photoRowCount: 0,
      limit: undefined,
      isReady: true,
    };
  }

  const photoRowCount = query.data?.count ?? 0;
  const limit = query.data?.limit;
  const isReady = query.isSuccess && limit !== undefined;
  const atLimit = isReady && limit !== undefined && photoRowCount >= limit;

  return {
    atLimit,
    photoRowCount,
    limit,
    isReady,
  };
}
