import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';

export const UNREAD_NOTIFICATION_COUNT_QUERY_KEY = 'unread_notification_count';

/**
 * Returns the number of unread notifications for the current user.
 * Also subscribes to realtime inserts on the notifications table
 * to keep the count up to date.
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
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

  // Subscribe to new notifications for real-time badge updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('unread-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: [UNREAD_NOTIFICATION_COUNT_QUERY_KEY],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}
