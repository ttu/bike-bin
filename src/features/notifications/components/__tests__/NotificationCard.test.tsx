import { fireEvent } from '@testing-library/react-native';
import { NotificationCard } from '../NotificationCard/NotificationCard';
import { renderWithProviders } from '@/test/utils';
import { createMockNotification } from '@/test/factories';
import { NotificationType } from '@/shared/types';

describe('NotificationCard', () => {
  it('renders notification title', () => {
    const notification = createMockNotification({ title: 'New borrow request' });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('New borrow request')).toBeTruthy();
  });

  it('renders notification body when present', () => {
    const notification = createMockNotification({
      title: 'Test',
      body: 'Someone wants to borrow your item',
    });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('Someone wants to borrow your item')).toBeTruthy();
  });

  it('does not render body when undefined', () => {
    const notification = createMockNotification({
      title: 'Test',
      body: undefined,
    });
    const { queryByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(queryByText('Someone wants to borrow your item')).toBeNull();
  });

  it.each([
    { type: NotificationType.NewMessage, label: 'New Message' },
    { type: NotificationType.BorrowRequestReceived, label: 'Borrow Request' },
    { type: NotificationType.BorrowRequestAccepted, label: 'Request Accepted' },
    { type: NotificationType.ReturnReminder, label: 'Return Reminder' },
    { type: NotificationType.RatingPrompt, label: 'Rate Your Experience' },
  ])('renders the "$label" type label for $type', ({ type, label }) => {
    const notification = createMockNotification({ type, title: 'Test' });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText(label)).toBeTruthy();
  });

  it('shows unread dot when notification is not read', () => {
    const notification = createMockNotification({ isRead: false });
    const { getByLabelText } = renderWithProviders(
      <NotificationCard notification={notification} />,
    );
    expect(getByLabelText('1 unread')).toBeTruthy();
  });

  it('does not show unread dot when notification is read', () => {
    const notification = createMockNotification({ isRead: true });
    const { queryByLabelText } = renderWithProviders(
      <NotificationCard notification={notification} />,
    );
    expect(queryByLabelText('1 unread')).toBeNull();
  });

  it('calls onPress with the notification when tapped', () => {
    const notification = createMockNotification({ title: 'Tap me' });
    const onPress = jest.fn();
    const { getByRole } = renderWithProviders(
      <NotificationCard notification={notification} onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(notification);
  });

  it('renders relative time for recent notification', () => {
    const notification = createMockNotification({
      createdAt: new Date().toISOString(),
      title: 'Test',
    });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('just now')).toBeTruthy();
  });
});
