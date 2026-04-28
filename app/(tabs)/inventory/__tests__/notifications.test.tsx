import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { renderWithProviders } from '@/test/utils';
import {
  NotificationType,
  type Notification,
  type NotificationId,
  type UserId,
} from '@/shared/types';
import commonEn from '@/i18n/en/common.json';
import notificationsEn from '@/i18n/en/notifications.json';
import NotificationsScreen from '../notifications';

const mockPush = jest.fn();
const mockMarkRead = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

jest.mock('@/features/notifications/hooks/useRealtimeNotifications', () => ({
  useRealtimeNotifications: jest.fn(),
}));

const mockHookState: {
  data: Notification[] | undefined;
  isLoading: boolean;
} = {
  data: undefined,
  isLoading: false,
};

jest.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => ({
    data: mockHookState.data,
    isLoading: mockHookState.isLoading,
  }),
}));

jest.mock('@/features/notifications/hooks/useMarkNotificationRead', () => ({
  useMarkNotificationRead: () => ({ mutate: mockMarkRead }),
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

function makeNotification(overrides: Partial<Notification>): Notification {
  return {
    id: 'n-1' as NotificationId,
    userId: 'u-1' as UserId,
    type: NotificationType.RatingPrompt,
    title: 'T',
    body: undefined,
    data: {},
    isRead: true,
    createdAt: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookState.data = undefined;
    mockHookState.isLoading = false;
  });

  it('shows loading while notifications are loading', () => {
    mockHookState.isLoading = true;

    renderWithProviders(<NotificationsScreen />);

    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
  });

  it('shows empty state when there are no notifications', () => {
    mockHookState.data = [];

    renderWithProviders(<NotificationsScreen />);

    expect(screen.getByText(notificationsEn.empty)).toBeTruthy();
  });

  it('navigates to conversation for new_message with string conversationId', () => {
    mockHookState.data = [
      makeNotification({
        id: 'n-msg' as NotificationId,
        type: NotificationType.NewMessage,
        title: 'Hello',
        data: { conversationId: 'conv-99' },
        isRead: true,
      }),
    ];

    renderWithProviders(<NotificationsScreen />);

    fireEvent.press(screen.getByLabelText(`${notificationsEn.types.new_message}: Hello`));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/messages/conv-99');
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('navigates for new_message when conversationId is numeric', () => {
    mockHookState.data = [
      makeNotification({
        id: 'n-num' as NotificationId,
        type: NotificationType.NewMessage,
        title: 'Num',
        data: { conversationId: 42 },
        isRead: true,
      }),
    ];

    renderWithProviders(<NotificationsScreen />);

    fireEvent.press(screen.getByLabelText(`${notificationsEn.types.new_message}: Num`));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/messages/42');
  });

  it('does not navigate for new_message when conversationId is missing', () => {
    mockHookState.data = [
      makeNotification({
        id: 'n-none' as NotificationId,
        type: NotificationType.NewMessage,
        title: 'No conv',
        data: {},
        isRead: true,
      }),
    ];

    renderWithProviders(<NotificationsScreen />);

    fireEvent.press(screen.getByLabelText(`${notificationsEn.types.new_message}: No conv`));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to borrow requests for borrow_request_received', () => {
    mockHookState.data = [
      makeNotification({
        id: 'n-borrow' as NotificationId,
        type: NotificationType.BorrowRequestReceived,
        title: 'Borrow',
        isRead: true,
      }),
    ];

    renderWithProviders(<NotificationsScreen />);

    fireEvent.press(
      screen.getByLabelText(`${notificationsEn.types.borrow_request_received}: Borrow`),
    );

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile/borrow-requests');
  });

  it('navigates to borrow requests for return_reminder', () => {
    mockHookState.data = [
      makeNotification({
        id: 'n-ret' as NotificationId,
        type: NotificationType.ReturnReminder,
        title: 'Return',
        isRead: true,
      }),
    ];

    renderWithProviders(<NotificationsScreen />);

    fireEvent.press(screen.getByLabelText(`${notificationsEn.types.return_reminder}: Return`));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile/borrow-requests');
  });

  it('does not navigate for unhandled notification types', () => {
    mockHookState.data = [
      makeNotification({
        id: 'n-rate' as NotificationId,
        type: NotificationType.RatingPrompt,
        title: 'Rate',
        isRead: true,
      }),
    ];

    renderWithProviders(<NotificationsScreen />);

    fireEvent.press(screen.getByLabelText(`${notificationsEn.types.rating_prompt}: Rate`));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('marks unread notifications when pressed', () => {
    mockHookState.data = [
      makeNotification({
        id: 'n-unread' as NotificationId,
        type: NotificationType.ReturnReminder,
        title: 'Unread rem',
        isRead: false,
      }),
    ];

    renderWithProviders(<NotificationsScreen />);

    fireEvent.press(screen.getByLabelText(`${notificationsEn.types.return_reminder}: Unread rem`));

    expect(mockMarkRead).toHaveBeenCalledWith('n-unread');
  });
});
