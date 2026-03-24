import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';

export function useUserTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_tags');

      if (error) throw error;
      return (data as string[]) ?? [];
    },
    enabled: !!user,
  });
}
