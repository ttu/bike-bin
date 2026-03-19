import type { Notification } from '@/shared/types';
import type { NotificationId, UserId } from '@/shared/types';
import type { NotificationType } from '@/shared/types';

/** Transforms a Supabase row into the Notification domain model. */
export function mapNotificationRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as NotificationId,
    userId: row.user_id as UserId,
    type: row.type as NotificationType,
    title: row.title as string,
    body: (row.body as string) ?? undefined,
    data: (row.data as Record<string, unknown>) ?? {},
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  };
}
