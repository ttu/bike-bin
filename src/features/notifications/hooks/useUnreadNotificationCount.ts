import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';

export const UNREAD_NOTIFICATION_COUNT_QUERY_KEY = 'unread_notification_count';

/**
 * Returns the number of unread notifications for the current user.
 * Realtime updates are driven by `useRealtimeNotifications`, which must be
 * mounted somewhere in the tree (typically once at the app root) so the
 * count stays fresh without each consumer opening its own channel.
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [UNREAD_NOTIFICATION_COUNT_QUERY_KEY, user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}
