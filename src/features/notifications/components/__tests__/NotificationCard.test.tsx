import { fireEvent } from '@testing-library/react-native';
import { NotificationCard } from '../NotificationCard/NotificationCard';
import { renderWithProviders } from '@/test/utils';
import { createMockNotification } from '@/test/factories';

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

  it('renders type label for known notification types', () => {
    const notification = createMockNotification({
      type: 'new_message',
      title: 'Test',
    });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('New Message')).toBeTruthy();
  });

  it('renders type label for borrow_request_received', () => {
    const notification = createMockNotification({
      type: 'borrow_request_received',
      title: 'Test',
    });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('Borrow Request')).toBeTruthy();
  });

  it('renders type label for borrow_request_accepted', () => {
    const notification = createMockNotification({
      type: 'borrow_request_accepted',
      title: 'Test',
    });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('Request Accepted')).toBeTruthy();
  });

  it('renders type label for return_reminder', () => {
    const notification = createMockNotification({
      type: 'return_reminder',
      title: 'Test',
    });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('Return Reminder')).toBeTruthy();
  });

  it('renders type label for rating_prompt', () => {
    const notification = createMockNotification({
      type: 'rating_prompt',
      title: 'Test',
    });
    const { getByText } = renderWithProviders(<NotificationCard notification={notification} />);
    expect(getByText('Rate Your Experience')).toBeTruthy();
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
    expect(getByText('Just now')).toBeTruthy();
  });
});
