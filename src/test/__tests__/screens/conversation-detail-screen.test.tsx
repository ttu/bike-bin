import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import type { ConversationId, ItemId, UserId } from '@/shared/types';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Visibility,
} from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import commonEn from '@/i18n/en/common.json';
import ConversationDetailScreen from '../../../../app/(tabs)/messages/[id]';

const EXPECTED_SEND_SUCCESS_MESSAGE = commonEn.feedback.messageSent;
const EXPECTED_SEND_FAILED_MESSAGE = commonEn.errors.generic;

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
  },
}));

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'conv-1' }),
  useRouter: () => ({ push: (...args: unknown[]) => mockRouterPush(...args) }),
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockUserId = 'user-self' as UserId;
const mockOtherId = 'user-other' as UserId;

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: mockUserId },
    isAuthenticated: true,
    session: null,
    isLoading: false,
  }),
}));

const mockConversation = {
  id: 'conv-1' as ConversationId,
  itemId: 'item-1' as ItemId,
  itemOwnerId: mockUserId,
  itemName: 'Brake pads',
  itemStatus: ItemStatus.Stored,
  itemAvailabilityTypes: undefined,
  itemPhotoPath: undefined,
  otherParticipantId: mockOtherId,
  otherParticipantName: 'Alex',
  otherParticipantAvatarUrl: undefined,
  lastMessageBody: undefined,
  lastMessageSenderId: undefined,
  lastMessageAt: undefined,
  unreadCount: 0,
  createdAt: new Date().toISOString(),
};

const mockSendMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: (err: Error) => void }) => {
    opts?.onSuccess?.();
  },
);

const mockMarkDonatedMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);
const mockMarkSoldMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);

jest.mock('@/features/messaging', () => ({
  ...jest.requireActual<typeof import('@/features/messaging')>('@/features/messaging'),
  useConversation: () => ({ data: mockConversation, isLoading: false }),
  useMessages: () => ({
    data: { pages: [[]], pageParams: [undefined] },
    isLoading: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
  useSendMessage: () => ({ mutate: mockSendMutate, isPending: false }),
  useRealtimeMessages: jest.fn(),
  ChatBubble: () => null,
  ItemReferenceCard: ({ onViewItem }: { onViewItem: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- inline mock component
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID="view-item-card" onPress={onViewItem}>
        <Text>Item card</Text>
      </Pressable>
    );
  },
}));

const mockConversationItem = createMockItem({
  id: 'item-1' as ItemId,
  ownerId: mockUserId,
  name: 'Brake pads',
  category: ItemCategory.Component,
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Donatable, AvailabilityType.Sellable],
  visibility: Visibility.All,
});

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual<typeof import('@/features/inventory')>('@/features/inventory'),
  useItem: () => ({
    data: mockConversationItem,
    isLoading: false,
  }),
}));

jest.mock('@/features/exchange', () => ({
  useMarkDonated: () => ({ mutate: mockMarkDonatedMutate, isPending: false }),
  useMarkSold: () => ({ mutate: mockMarkSoldMutate, isPending: false }),
}));

jest.mock('@/shared/hooks/useReport', () => ({
  useReport: () => ({ mutate: jest.fn(), isPending: false }),
}));

describe('ConversationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows participant name and navigates back', () => {
    renderWithProviders(<ConversationDetailScreen />);
    expect(screen.getByText('Alex')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/messages');
  });

  it('sends a message when input has text and shows success snackbar', async () => {
    renderWithProviders(<ConversationDetailScreen />);
    const input = screen.getByLabelText('Type a message...');
    fireEvent.changeText(input, 'Hello');
    fireEvent.press(screen.getByLabelText('Send'));
    await waitFor(() => {
      expect(mockSendMutate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(EXPECTED_SEND_SUCCESS_MESSAGE)).toBeTruthy();
    });
  });

  it('shows error snackbar when send fails', async () => {
    mockSendMutate.mockImplementationOnce(
      (_vars: unknown, opts?: { onSuccess?: () => void; onError?: (err: Error) => void }) => {
        opts?.onError?.(new Error('send failed'));
      },
    );
    renderWithProviders(<ConversationDetailScreen />);
    const input = screen.getByLabelText('Type a message...');
    fireEvent.changeText(input, 'Hello');
    fireEvent.press(screen.getByLabelText('Send'));
    await waitFor(() => {
      expect(screen.getByText(EXPECTED_SEND_FAILED_MESSAGE)).toBeTruthy();
    });
  });

  it('opens item detail route from reference card', () => {
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent.press(screen.getByTestId('view-item-card'));
    expect(mockRouterPush).toHaveBeenCalled();
  });
});
