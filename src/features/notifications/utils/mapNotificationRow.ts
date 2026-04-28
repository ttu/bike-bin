import type {
  Notification,
  NotificationId,
  NotificationRow,
  NotificationType,
  UserId,
} from '@/shared/types';

/** Transforms a Supabase row into the Notification domain model. */
export function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id as NotificationId,
    userId: row.user_id as UserId,
    type: row.type as NotificationType,
    title: row.title as string,
    body: row.body ?? undefined,
    data: (row.data as Record<string, unknown>) ?? {},
    isRead: row.is_read,
    createdAt: row.created_at as string,
  };
}
