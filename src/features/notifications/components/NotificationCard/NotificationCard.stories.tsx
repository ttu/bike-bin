import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { NotificationType } from '@/shared/types';
import { createMockNotification } from '@/test/factories';
import { NotificationCard } from './NotificationCard';

const meta = {
  title: 'Notifications/NotificationCard',
  component: NotificationCard,
} satisfies Meta<typeof NotificationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unread: Story = {
  args: {
    notification: createMockNotification({
      title: 'Borrow request',
      body: 'Someone wants to borrow your item.',
      type: NotificationType.BorrowRequestReceived,
      isRead: false,
    }),
    onPress: fn(),
  },
};

export const Read: Story = {
  args: {
    notification: createMockNotification({
      title: 'Message',
      body: 'Thanks for the quick reply!',
      type: NotificationType.NewMessage,
      isRead: true,
    }),
    onPress: fn(),
  },
};
