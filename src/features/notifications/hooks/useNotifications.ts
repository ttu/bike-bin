import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { Notification } from '@/shared/types';
import type { NotificationId, UserId } from '@/shared/types';
import type { NotificationType } from '@/shared/types';

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

      return (data ?? []).map((row) => ({
        id: row.id as string as NotificationId,
        userId: row.user_id as string as UserId,
        type: row.type as NotificationType,
        title: row.title as string,
        body: (row.body as string) ?? undefined,
        data: (row.data as Record<string, unknown>) ?? {},
        isRead: row.is_read as boolean,
        createdAt: row.created_at as string,
      }));
    },
    enabled: !!user,
  });
}
