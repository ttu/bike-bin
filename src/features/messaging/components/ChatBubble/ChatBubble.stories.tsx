import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import type { ConversationId, MessageId, UserId } from '@/shared/types';
import type { MessageWithSender } from '../../types';
import { ChatBubble } from './ChatBubble';

const meta = {
  title: 'Messaging/ChatBubble',
  component: ChatBubble,
} satisfies Meta<typeof ChatBubble>;

export default meta;

type Story = StoryObj<typeof meta>;

const incoming: MessageWithSender = {
  id: 'msg-1' as MessageId,
  conversationId: 'conv-1' as ConversationId,
  senderId: 'user-2' as UserId,
  body: 'Is this still available?',
  createdAt: '2026-03-18T10:30:00Z',
  isOwn: false,
};

const outgoing: MessageWithSender = {
  ...incoming,
  id: 'msg-2' as MessageId,
  senderId: 'user-1' as UserId,
  body: 'Yes — pick up any weekday after 5pm.',
  createdAt: '2026-03-18T10:32:00Z',
  isOwn: true,
};

export const Incoming: Story = {
  args: {
    message: incoming,
    onLongPress: fn(),
  },
};

export const Outgoing: Story = {
  args: {
    message: outgoing,
    onLongPress: fn(),
  },
};
