import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockConversationListItem } from '@/test/factories';
import {
  useConversations,
  useUnreadCountByConversation,
  type ConversationListItem,
} from '@/features/messaging';
import MessagesScreen from '../index';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaView: View,
    SafeAreaProvider: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

jest.mock('@/features/messaging', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, Pressable } = require('react-native');
  return {
    useConversations: jest.fn(),
    useUnreadCountByConversation: jest.fn(),
    ConversationCard: ({
      conversation,
      onPress,
    }: {
      readonly conversation: { otherParticipantName: string; unreadCount: number };
      readonly onPress?: (c: unknown) => void;
    }) => (
      <Pressable
        onPress={() => onPress?.(conversation)}
        accessibilityLabel={`${conversation.otherParticipantName} unread:${conversation.unreadCount}`}
      >
        <View>
          <Text>{conversation.otherParticipantName}</Text>
        </View>
      </Pressable>
    ),
  };
});

const mockUseConversations = jest.mocked(useConversations);
const mockUseUnreadCountByConversation = jest.mocked(useUnreadCountByConversation);

describe('MessagesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUnreadCountByConversation.mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useUnreadCountByConversation>);
  });

  it('shows loading screen while conversations load', () => {
    mockUseConversations.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as UseQueryResult<ConversationListItem[], Error>);
    const { queryByText } = renderWithProviders(<MessagesScreen />);
    expect(queryByText('Messages')).toBeNull();
  });

  it('renders empty state when there are no conversations', () => {
    mockUseConversations.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as UseQueryResult<ConversationListItem[], Error>);
    const { getByText } = renderWithProviders(<MessagesScreen />);
    expect(getByText('No conversations yet')).toBeTruthy();
    expect(getByText('Start one by contacting a listing owner.')).toBeTruthy();
  });

  it('navigates to conversation detail when a card is pressed', () => {
    const item = createMockConversationListItem();
    mockUseConversations.mockReturnValue({
      data: [item],
      isLoading: false,
    } as unknown as UseQueryResult<ConversationListItem[], Error>);
    const { getByLabelText } = renderWithProviders(<MessagesScreen />);
    fireEvent.press(getByLabelText(/^Alice unread:/));
    expect(mockPush).toHaveBeenCalledWith('/messages/conv-1');
  });

  it('merges per-conversation unread counts from the RPC into each card', () => {
    const a = createMockConversationListItem({
      id: 'conv-a' as ConversationListItem['id'],
      otherParticipantName: 'Alice',
      unreadCount: 0,
    });
    const b = createMockConversationListItem({
      id: 'conv-b' as ConversationListItem['id'],
      otherParticipantName: 'Bob',
      unreadCount: 0,
    });
    mockUseConversations.mockReturnValue({
      data: [a, b],
      isLoading: false,
    } as unknown as UseQueryResult<ConversationListItem[], Error>);
    mockUseUnreadCountByConversation.mockReturnValue({
      data: new Map([[a.id, 3]]),
    } as unknown as ReturnType<typeof useUnreadCountByConversation>);

    const { getByLabelText } = renderWithProviders(<MessagesScreen />);
    expect(getByLabelText('Alice unread:3')).toBeTruthy();
    expect(getByLabelText('Bob unread:0')).toBeTruthy();
  });

  it('falls back to seeded unreadCount when the RPC data is not a Map (demo mode)', () => {
    const seeded = createMockConversationListItem({
      otherParticipantName: 'Alice',
      unreadCount: 2,
    });
    mockUseConversations.mockReturnValue({
      data: [seeded],
      isLoading: false,
    } as unknown as UseQueryResult<ConversationListItem[], Error>);
    mockUseUnreadCountByConversation.mockReturnValue({
      data: 2 as unknown as Map<ConversationListItem['id'], number>,
    } as unknown as ReturnType<typeof useUnreadCountByConversation>);

    const { getByLabelText } = renderWithProviders(<MessagesScreen />);
    expect(getByLabelText('Alice unread:2')).toBeTruthy();
  });
});
