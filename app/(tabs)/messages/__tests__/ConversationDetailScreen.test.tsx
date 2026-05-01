import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import { mockAuthModule } from '@/test/authMocks';
import commonEn from '@/i18n/en/common.json';
import ConversationDetailScreen from '../[id]';
import type { ConversationListItem, MessageWithSender } from '@/features/messaging/types';
import type { ConversationId, ItemId, MessageId, UserId } from '@/shared/types';

const mockShowSnackbarAlert = jest.fn();

jest.mock('@/shared/components/SnackbarAlerts', () => {
  const actual = jest.requireActual<typeof import('@/shared/components/SnackbarAlerts')>(
    '@/shared/components/SnackbarAlerts',
  );
  return {
    ...actual,
    useSnackbarAlerts: () => ({ showSnackbarAlert: mockShowSnackbarAlert }),
  };
});

const mockReportMutate = jest.fn();
jest.mock('@/shared/hooks/useReport', () => ({
  useReport: () => ({ mutate: mockReportMutate, isPending: false }),
}));

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockDismiss = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'conv-1' }),
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
  router: {
    canDismiss: () => true,
    dismiss: (...args: unknown[]) => mockDismiss(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
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

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('@/features/auth', () => mockAuthModule);

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
  itemOwnerId: undefined,
  itemGroupId: undefined,
  groupName: undefined,
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

/** Mutable ref so tests can swap conversation data without remocking the module. */
const conversationQueryState = { data: mockConversation };

const mockMessages: MessageWithSender[] = [];

const mockSendMutate = jest.fn();

jest.mock('@/features/messaging', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require('react-native');
  return {
    useConversation: () => ({ data: conversationQueryState.data, isLoading: false }),
    useMessages: () => ({
      data: { pages: [mockMessages], pageParams: [] },
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    }),
    useSendMessage: () => ({ mutate: mockSendMutate, isPending: false }),
    useRealtimeMessages: jest.fn(),
    useMarkConversationRead: () => ({ mutate: jest.fn(), isPending: false }),
    useUserBorrowHistory: () => ({
      data: { borrowCount: 0, completedOnTimeCount: 0 },
    }),
    ChatBubble: ({
      message,
      onLongPress,
    }: {
      readonly message: MessageWithSender;
      readonly onLongPress?: (msg: MessageWithSender) => void;
    }) =>
      React.createElement(
        Pressable,
        {
          testID: `chat-bubble-${message.id}`,
          onLongPress: () => onLongPress?.(message),
        },
        React.createElement(Text, null, message.body),
      ),
    ItemContextStrip: () => null,
    isGroupConversation: jest.requireActual('@/features/messaging').isGroupConversation,
  };
});

jest.mock('@/features/inventory', () => ({
  useItem: () => ({ data: undefined }),
}));

jest.mock('@/features/exchange', () => ({
  ...jest.requireActual('@/features/exchange'),
  useMarkExchanged: () => ({ mutate: jest.fn() }),
}));

describe('ConversationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    conversationQueryState.data = mockConversation;
    mockMessages.length = 0;
    mockSendMutate.mockImplementation(
      (_vars: unknown, opts: { onSuccess?: () => void; onError?: () => void }) => {
        opts.onSuccess?.();
      },
    );
  });

  it('shows success snackbar after sending a message', () => {
    const { getByLabelText } = renderWithProviders(<ConversationDetailScreen />);
    fireEvent.changeText(getByLabelText('Type a message...'), 'Hello');
    fireEvent.press(getByLabelText('Send'));
    expect(mockSendMutate).toHaveBeenCalled();
    expect(mockShowSnackbarAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'success',
        message: commonEn.feedback.messageSent,
      }),
    );
  });

  it('shows error snackbar when send mutation fails', () => {
    mockSendMutate.mockImplementationOnce(
      (_vars: unknown, opts?: { onError?: (e: Error) => void }) => {
        opts?.onError?.(new Error('send failed'));
      },
    );
    const { getByLabelText } = renderWithProviders(<ConversationDetailScreen />);
    fireEvent.changeText(getByLabelText('Type a message...'), 'Hello');
    fireEvent.press(getByLabelText('Send'));
    expect(mockShowSnackbarAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'error',
        message: commonEn.errors.generic,
        duration: 'long',
      }),
    );
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

  it('defers ConfirmDialog after opening mark donated so confirmation is not swallowed', () => {
    const setTimeoutSpy = jest
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((fn: TimerHandler) => {
        if (typeof fn === 'function') fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });
    conversationQueryState.data = {
      ...mockConversation,
      itemId: 'item-1' as ItemId,
      itemOwnerId: 'user-123' as UserId,
      itemName: 'Chain',
      itemStatus: 'stored',
    };

    const { getByLabelText, getByText } = renderWithProviders(<ConversationDetailScreen />);

    fireEvent.press(getByLabelText('More actions'));
    fireEvent.press(getByText('Mark as Donated'));

    expect(getByText('Mark as donated?')).toBeTruthy();

    setTimeoutSpy.mockRestore();
  });

  it('defers ConfirmDialog after opening mark sold so confirmation is not swallowed', () => {
    const setTimeoutSpy = jest
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((fn: TimerHandler) => {
        if (typeof fn === 'function') fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });
    conversationQueryState.data = {
      ...mockConversation,
      itemId: 'item-1' as ItemId,
      itemOwnerId: 'user-123' as UserId,
      itemName: 'Chain',
      itemStatus: 'stored',
    };

    const { getByLabelText, getByText } = renderWithProviders(<ConversationDetailScreen />);

    fireEvent.press(getByLabelText('More actions'));
    fireEvent.press(getByText('Mark as Sold'));

    expect(getByText('Mark as sold?')).toBeTruthy();

    setTimeoutSpy.mockRestore();
  });

  it('opens report dialog on long-press of another user message', () => {
    mockMessages.push({
      id: 'msg-other' as MessageId,
      conversationId: 'conv-1' as ConversationId,
      senderId: 'other-user' as UserId,
      body: 'Offensive message',
      createdAt: '2026-01-01T00:00:00Z',
      isOwn: false,
    });

    const { getByTestId, getByText } = renderWithProviders(<ConversationDetailScreen />);

    fireEvent(getByTestId('chat-bubble-msg-other'), 'longPress');

    // ReportDialog should be visible (rendered with visible=true)
    expect(getByText('Report')).toBeTruthy();
  });

  it('does not open report dialog on long-press of own message', () => {
    mockMessages.push({
      id: 'msg-own' as MessageId,
      conversationId: 'conv-1' as ConversationId,
      senderId: 'user-123' as UserId,
      body: 'My message',
      createdAt: '2026-01-01T00:00:00Z',
      isOwn: true,
    });

    const { getByTestId, queryByText } = renderWithProviders(<ConversationDetailScreen />);

    fireEvent(getByTestId('chat-bubble-msg-own'), 'longPress');

    // ReportDialog should not appear for own messages
    expect(queryByText('Report')).toBeNull();
  });

  it('calls reportMutation.mutate with correct args on report submit', () => {
    mockReportMutate.mockImplementation((_input: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });

    mockMessages.push({
      id: 'msg-report-2' as MessageId,
      conversationId: 'conv-1' as ConversationId,
      senderId: 'other-user' as UserId,
      body: 'Spam message',
      createdAt: '2026-01-01T00:00:00Z',
      isOwn: false,
    });

    const { getByTestId, getByText } = renderWithProviders(<ConversationDetailScreen />);

    // Long-press to open report dialog
    fireEvent(getByTestId('chat-bubble-msg-report-2'), 'longPress');
    expect(getByText('Report')).toBeTruthy();

    // Select a reason and submit
    fireEvent.press(getByText('Spam'));
    fireEvent.press(getByText('Submit Report'));

    expect(mockReportMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'user-123',
        targetType: 'message',
        targetId: 'msg-report-2',
        reason: 'spam',
      }),
      expect.any(Object),
    );

    // Success snackbar shown
    expect(mockShowSnackbarAlert).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success' }),
    );
  });

  it('shows error snackbar when report mutation fails', () => {
    mockReportMutate.mockImplementation((_input: unknown, opts: { onError?: () => void }) => {
      opts.onError?.();
    });

    mockMessages.push({
      id: 'msg-fail' as MessageId,
      conversationId: 'conv-1' as ConversationId,
      senderId: 'other-user' as UserId,
      body: 'Fail report',
      createdAt: '2026-01-01T00:00:00Z',
      isOwn: false,
    });

    const { getByTestId, getByText } = renderWithProviders(<ConversationDetailScreen />);

    fireEvent(getByTestId('chat-bubble-msg-fail'), 'longPress');
    fireEvent.press(getByText('Spam'));
    fireEvent.press(getByText('Submit Report'));

    expect(mockShowSnackbarAlert).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error' }),
    );
  });
});
