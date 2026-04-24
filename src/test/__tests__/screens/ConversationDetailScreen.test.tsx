import React from 'react';
import { FlatList } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import type { MessageWithSender } from '@/features/messaging/types';
import type { ConversationId, ItemId, MessageId, UserId } from '@/shared/types';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Visibility,
} from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import commonEn from '@/i18n/en/common.json';
import exchangeEn from '@/i18n/en/exchange.json';
import profileEn from '@/i18n/en/profile.json';
import messagesEn from '@/i18n/en/messages.json';
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

const baseConversation = {
  id: 'conv-1' as ConversationId,
  itemId: 'item-1' as ItemId,
  itemOwnerId: mockUserId,
  itemName: 'Brake pads',
  itemStatus: ItemStatus.Stored,
  itemAvailabilityTypes: undefined,
  itemPhotoPath: undefined,
  otherParticipantId: mockOtherId,
  otherParticipantName: 'Alex',
  otherParticipantAvatarUrl: undefined as string | undefined,
  lastMessageBody: undefined,
  lastMessageSenderId: undefined,
  lastMessageAt: undefined,
  unreadCount: 0,
  createdAt: new Date().toISOString(),
};

let mockConversation = { ...baseConversation };

let mockMessagePages: MessageWithSender[][] = [[]];
let mockHasNextPage = false;
let mockSendPending = false;
const mockFetchNextPage = jest.fn();

const mockIncomingMessage: MessageWithSender = {
  id: 'msg-1' as MessageId,
  conversationId: 'conv-1' as ConversationId,
  senderId: mockOtherId,
  body: 'Hello there',
  createdAt: new Date().toISOString(),
  isOwn: false,
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
    data: { pages: mockMessagePages, pageParams: [undefined] },
    isLoading: false,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: mockHasNextPage,
    isFetchingNextPage: false,
  }),
  useSendMessage: () => ({ mutate: mockSendMutate, isPending: mockSendPending }),
  useRealtimeMessages: jest.fn(),
  useUserBorrowHistory: () => ({
    data: { borrowCount: 0, completedOnTimeCount: 0 },
  }),
  ChatBubble: ({
    message,
    onLongPress,
  }: {
    message: MessageWithSender;
    onLongPress?: (msg: MessageWithSender) => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- inline mock component
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID={`chat-bubble-${message.id}`} onLongPress={() => onLongPress?.(message)}>
        <Text>{message.body}</Text>
      </Pressable>
    );
  },
  ItemContextStrip: ({ onPress }: { onPress?: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- inline mock component
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID="view-item-card" onPress={onPress}>
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
  ...jest.requireActual('@/features/exchange'),
  useMarkDonated: () => ({ mutate: mockMarkDonatedMutate, isPending: false }),
  useMarkSold: () => ({ mutate: mockMarkSoldMutate, isPending: false }),
}));

const mockReportMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);

jest.mock('@/shared/hooks/useReport', () => ({
  useReport: () => ({ mutate: mockReportMutate, isPending: false }),
}));

describe('ConversationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConversation = { ...baseConversation };
    mockMessagePages = [[]];
    mockHasNextPage = false;
    mockSendPending = false;
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

  it('shows empty state copy when there are no messages', () => {
    renderWithProviders(<ConversationDetailScreen />);
    expect(screen.getByText(messagesEn.conversation.noMessages)).toBeTruthy();
  });

  it('fetches older messages when the list reaches the end', () => {
    mockMessagePages = [[mockIncomingMessage]];
    mockHasNextPage = true;
    const { UNSAFE_getByType } = renderWithProviders(<ConversationDetailScreen />);
    const list = UNSAFE_getByType(FlatList);
    list.props.onEndReached?.({ distanceFromEnd: 0 });
    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it('navigates to profile when header is pressed', () => {
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent.press(screen.getByTestId('conversation-header-profile'));
    expect(mockRouterPush).toHaveBeenCalled();
  });

  it('shows send progress while a message is sending', () => {
    mockSendPending = true;
    renderWithProviders(<ConversationDetailScreen />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('opens exchange confirm and completes mark donated', async () => {
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent.press(screen.getByLabelText(messagesEn.conversation.moreActions));
    fireEvent.press(screen.getByText(exchangeEn.ownerActions.markDonated));
    await waitFor(() => {
      expect(screen.getByText(exchangeEn.confirm.donate.title)).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockMarkDonatedMutate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(commonEn.feedback.markedDonated)).toBeTruthy();
    });
  });

  it('completes mark sold from the exchange menu', async () => {
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent.press(screen.getByLabelText(messagesEn.conversation.moreActions));
    fireEvent.press(screen.getByText(exchangeEn.ownerActions.markSold));
    await waitFor(() => {
      expect(screen.getByText(exchangeEn.confirm.sell.title)).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockMarkSoldMutate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(commonEn.feedback.markedSold)).toBeTruthy();
    });
  });

  it('shows generic error when mark donated fails from the menu', async () => {
    mockMarkDonatedMutate.mockImplementationOnce(
      (_vars: unknown, opts?: { onError?: () => void }) => {
        opts?.onError?.();
      },
    );
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent.press(screen.getByLabelText(messagesEn.conversation.moreActions));
    fireEvent.press(screen.getByText(exchangeEn.ownerActions.markDonated));
    await waitFor(() => {
      expect(screen.getByText(exchangeEn.confirm.donate.title)).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('shows generic error when mark sold fails from the menu', async () => {
    mockMarkSoldMutate.mockImplementationOnce((_vars: unknown, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent.press(screen.getByLabelText(messagesEn.conversation.moreActions));
    fireEvent.press(screen.getByText(exchangeEn.ownerActions.markSold));
    await waitFor(() => {
      expect(screen.getByText(exchangeEn.confirm.sell.title)).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('submits a message report from long-press', async () => {
    mockMessagePages = [[mockIncomingMessage]];
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent(screen.getByTestId(`chat-bubble-${mockIncomingMessage.id}`), 'longPress');
    await waitFor(() => {
      expect(screen.getByText(profileEn.report.title)).toBeTruthy();
    });
    fireEvent.press(screen.getByText(profileEn.report.reasons.spam));
    fireEvent.press(screen.getByText(profileEn.report.submit));
    await waitFor(() => {
      expect(mockReportMutate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(profileEn.report.successMessage)).toBeTruthy();
    });
  });

  it('shows report error when the report mutation fails', async () => {
    mockReportMutate.mockImplementationOnce((_vars: unknown, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    mockMessagePages = [[mockIncomingMessage]];
    renderWithProviders(<ConversationDetailScreen />);
    fireEvent(screen.getByTestId(`chat-bubble-${mockIncomingMessage.id}`), 'longPress');
    await waitFor(() => {
      expect(screen.getByText(profileEn.report.title)).toBeTruthy();
    });
    fireEvent.press(screen.getByText(profileEn.report.reasons.spam));
    fireEvent.press(screen.getByText(profileEn.report.submit));
    await waitFor(() => {
      expect(screen.getByText(profileEn.report.errorMessage)).toBeTruthy();
    });
  });
});
