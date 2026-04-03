import type { NotificationRow } from '@/shared/types';
import { mapNotificationRow } from '../mapNotificationRow';

describe('mapNotificationRow', () => {
  it('maps all fields', () => {
    const row: NotificationRow = {
      id: 'notif-1',
      user_id: 'user-1',
      type: 'borrow_request',
      title: 'New request',
      body: 'Someone wants your derailleur',
      data: { itemId: 'item-1' },
      is_read: false,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapNotificationRow(row)).toEqual({
      id: 'notif-1',
      userId: 'user-1',
      type: 'borrow_request',
      title: 'New request',
      body: 'Someone wants your derailleur',
      data: { itemId: 'item-1' },
      isRead: false,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('handles optional body and defaults data to empty object', () => {
    const row: NotificationRow = {
      id: 'notif-2',
      user_id: 'user-1',
      type: 'rating_received',
      title: 'New rating',
      body: null,
      data: null,
      is_read: true,
      created_at: '2026-01-01T00:00:00Z',
    };
    const result = mapNotificationRow(row);
    expect(result.body).toBeUndefined();
    expect(result.data).toEqual({});
  });
});
