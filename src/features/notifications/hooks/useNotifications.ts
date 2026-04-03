import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { Notification } from '@/shared/types';
import { mapNotificationRow } from '../utils/mapNotificationRow';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';

/**
 * Fetch the current user's notifications, ordered newest first.
 */
export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, user?.id],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => mapNotificationRow(row));
    },
    enabled: !!user,
  });
}
