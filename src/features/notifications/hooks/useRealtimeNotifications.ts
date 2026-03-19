import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { NOTIFICATIONS_QUERY_KEY } from './useNotifications';
import { UNREAD_NOTIFICATION_COUNT_QUERY_KEY } from './useUnreadNotificationCount';

/**
 * Subscribe to realtime notification inserts for the current user.
 * Automatically invalidates the notifications list and unread count
 * when new notifications arrive.
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
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
            queryKey: [NOTIFICATIONS_QUERY_KEY],
          });
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
}
