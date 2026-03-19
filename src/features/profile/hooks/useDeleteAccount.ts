import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';

/**
 * Mutation to delete the current user's account.
 * Calls the delete-account edge function which handles:
 * - Deleting items and photos
 * - Anonymizing conversations and ratings
 * - Deleting the profile
 * - Deleting the auth user
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}
