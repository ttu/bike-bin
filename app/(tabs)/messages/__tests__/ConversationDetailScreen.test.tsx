import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import ConversationDetailScreen from '../[id]';
import type { ConversationListItem } from '@/features/messaging/types';
import type { ConversationId, UserId } from '@/shared/types';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'conv-1' }),
  useRouter: () => ({
    canGoBack: () => true,
    back: jest.fn(),
    push: mockRouterPush,
    replace: jest.fn(),
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
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

const mockConversation: ConversationListItem = {
  id: 'conv-1' as ConversationId,
  itemId: undefined,
  itemName: undefined,
  itemStatus: undefined,
  itemAvailabilityTypes: undefined,
  itemPhotoPath: undefined,
  otherParticipantId: 'other-user-456' as UserId,
  otherParticipantName: 'Alice',
  otherParticipantAvatarUrl: undefined,
  lastMessageBody: undefined,
  lastMessageSenderId: undefined,
  lastMessageAt: undefined,
  unreadCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
};

jest.mock('@/features/messaging', () => ({
  useConversation: () => ({ data: mockConversation, isLoading: false }),
  useMessages: () => ({
    data: { pages: [[]], pageParams: [] },
    isLoading: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
  useSendMessage: () => ({ mutate: jest.fn(), isPending: false }),
  useRealtimeMessages: jest.fn(),
  ChatBubble: () => null,
  ItemReferenceCard: () => null,
}));

jest.mock('@/features/inventory', () => ({
  useItem: () => ({ data: undefined }),
}));

jest.mock('@/features/exchange', () => ({
  useMarkDonated: () => ({ mutate: jest.fn() }),
  useMarkSold: () => ({ mutate: jest.fn() }),
}));

describe('ConversationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to the other participant profile when the header is pressed', () => {
    const { getByTestId } = renderWithProviders(<ConversationDetailScreen />);
    fireEvent.press(getByTestId('conversation-header-profile'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/profile/[userId]',
      params: {
        userId: 'other-user-456',
        returnPath: encodeReturnPath('/(tabs)/messages/conv-1'),
      },
    });
  });
});
