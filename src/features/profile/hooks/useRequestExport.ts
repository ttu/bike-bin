import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';

export function useRequestExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      if (!initialSession) throw new Error('Not authenticated');

      // Use current access token only. Do not call refreshSession here: it POSTs to
      // /auth/v1/token?grant_type=refresh_token and can 400 (bad refresh token) on web/local.
      const accessToken = initialSession.access_token;

      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

      const { data, error } = await supabase.functions.invoke('request-export', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
      });

      if (error) throw error;
      return data as { success: boolean; exportRequestId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-export'] });
    },
  });
}
