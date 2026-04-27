import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockConversationListItem } from '@/test/factories';
import { useConversations, type ConversationListItem } from '@/features/messaging';
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
    ConversationCard: ({
      conversation,
      onPress,
    }: {
      readonly conversation: { otherParticipantName: string };
      readonly onPress?: (c: unknown) => void;
    }) => (
      <Pressable
        onPress={() => onPress?.(conversation)}
        accessibilityLabel={conversation.otherParticipantName}
      >
        <View>
          <Text>{conversation.otherParticipantName}</Text>
        </View>
      </Pressable>
    ),
  };
});

const mockUseConversations = jest.mocked(useConversations);

describe('MessagesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    fireEvent.press(getByLabelText('Alice'));
    expect(mockPush).toHaveBeenCalledWith('/messages/conv-1');
  });
});
