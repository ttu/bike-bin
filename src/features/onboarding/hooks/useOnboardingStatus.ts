import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { useQuery } from '@tanstack/react-query';

interface OnboardingStatus {
  isComplete: boolean;
  hasProfile: boolean;
  hasLocation: boolean;
  isLoading: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { user, isAuthenticated } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: isAuthenticated && !!user,
  });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('saved_locations')
        .select('id')
        .eq('user_id', user!.id)
        .limit(1);
      return data;
    },
    enabled: isAuthenticated && !!user,
  });

  const hasProfile = !!profile?.display_name;
  const hasLocation = (locations?.length ?? 0) > 0;

  return {
    isComplete: hasProfile && hasLocation,
    hasProfile,
    hasLocation,
    isLoading: profileLoading || locationsLoading,
  };
}
