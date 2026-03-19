import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { NotificationId } from '@/shared/types';
import { NOTIFICATIONS_QUERY_KEY } from './useNotifications';
import { UNREAD_NOTIFICATION_COUNT_QUERY_KEY } from './useUnreadNotificationCount';

/**
 * Mark a notification as read by updating `is_read` to true.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: NotificationId) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY],
      });
      void queryClient.invalidateQueries({
        queryKey: [UNREAD_NOTIFICATION_COUNT_QUERY_KEY],
      });
    },
  });
}
