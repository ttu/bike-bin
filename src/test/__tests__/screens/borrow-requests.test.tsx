import React from 'react';
import { FlatList } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import type { BorrowRequestWithDetails } from '@/features/borrow/types';
import type { BorrowRequestId, ItemId, UserId } from '@/shared/types';
import { BorrowRequestStatus, ItemStatus, AvailabilityType } from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import BorrowRequestsScreen from '../../../../app/(tabs)/profile/borrow-requests';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://test.supabase.co/storage/item-photos/${path}` },
        }),
      }),
    },
  },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const CURRENT_USER_ID = 'current-user' as UserId;
const OTHER_USER_ID = 'other-user' as UserId;

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: CURRENT_USER_ID },
    isAuthenticated: true,
    session: null,
    isLoading: false,
  }),
}));

const mockRefetch = jest.fn();
let mockRequests: BorrowRequestWithDetails[] = [];

const mutationWithSuccess = () =>
  jest.fn((_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  });

const mockAcceptMutate = mutationWithSuccess();
const mockDeclineMutate = mutationWithSuccess();
const mockCancelMutate = mutationWithSuccess();
const mockMarkReturnedMutate = mutationWithSuccess();

jest.mock('@/features/borrow', () => ({
  ...jest.requireActual<typeof import('@/features/borrow')>('@/features/borrow'),
  useBorrowRequests: () => ({
    data: mockRequests,
    isLoading: false,
    refetch: mockRefetch,
  }),
  useAcceptBorrowRequest: () => ({ mutate: mockAcceptMutate, isPending: false }),
  useDeclineBorrowRequest: () => ({ mutate: mockDeclineMutate, isPending: false }),
  useCancelBorrowRequest: () => ({ mutate: mockCancelMutate, isPending: false }),
  useMarkReturned: () => ({ mutate: mockMarkReturnedMutate, isPending: false }),
}));

function createRequest(overrides?: Partial<BorrowRequestWithDetails>): BorrowRequestWithDetails {
  return {
    id: 'req-1' as BorrowRequestId,
    itemId: 'item-1' as ItemId,
    requesterId: OTHER_USER_ID,
    status: BorrowRequestStatus.Pending,
    message: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemName: 'Test Item',
    itemStatus: ItemStatus.Reserved,
    itemOwnerId: CURRENT_USER_ID,
    itemAvailabilityTypes: [AvailabilityType.Borrowable],
    requesterName: 'Alice',
    requesterAvatarUrl: undefined,
    ownerName: 'Bob',
    ownerAvatarUrl: undefined,
    ...overrides,
  };
}

describe('BorrowRequestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequests = [createRequest()];
  });

  it('renders title and tab labels', () => {
    renderWithProviders(<BorrowRequestsScreen />);
    expect(screen.getByText('Borrow Requests')).toBeTruthy();
    expect(screen.getByText(/Incoming/)).toBeTruthy();
    expect(screen.getByText('Outgoing')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('calls tabScopedBack when header back is pressed', () => {
    renderWithProviders(<BorrowRequestsScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('shows pending count on incoming tab when there are pending requests', () => {
    mockRequests = [createRequest({ status: BorrowRequestStatus.Pending })];
    renderWithProviders(<BorrowRequestsScreen />);
    expect(screen.getByText('Incoming (1)')).toBeTruthy();
  });

  it('switches tabs and shows empty state copy for outgoing when empty', () => {
    mockRequests = [createRequest()];
    renderWithProviders(<BorrowRequestsScreen />);
    fireEvent.press(screen.getByText('Outgoing'));
    expect(screen.getByText('No outgoing requests')).toBeTruthy();
  });

  it('lists incoming requests and completes accept flow', async () => {
    mockRequests = [createRequest({ status: BorrowRequestStatus.Pending })];
    renderWithProviders(<BorrowRequestsScreen />);
    fireEvent.press(screen.getByTestId('accept-button'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockAcceptMutate).toHaveBeenCalled();
    });
  });

  it('completes decline flow', async () => {
    mockRequests = [createRequest({ status: BorrowRequestStatus.Pending })];
    renderWithProviders(<BorrowRequestsScreen />);
    fireEvent.press(screen.getByTestId('decline-button'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockDeclineMutate).toHaveBeenCalled();
    });
  });

  it('shows active borrow and completes mark returned', async () => {
    mockRequests = [
      createRequest({
        status: BorrowRequestStatus.Accepted,
        itemOwnerId: CURRENT_USER_ID,
        requesterId: OTHER_USER_ID,
        itemStatus: ItemStatus.Loaned,
      }),
    ];
    renderWithProviders(<BorrowRequestsScreen />);
    fireEvent.press(screen.getByText('Active'));
    fireEvent.press(screen.getByTestId('mark-returned-button'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockMarkReturnedMutate).toHaveBeenCalled();
    });
  });

  it('shows outgoing cancel for pending requester flow', async () => {
    mockRequests = [
      createRequest({
        status: BorrowRequestStatus.Pending,
        itemOwnerId: OTHER_USER_ID,
        requesterId: CURRENT_USER_ID,
      }),
    ];
    renderWithProviders(<BorrowRequestsScreen />);
    fireEvent.press(screen.getByText('Outgoing'));
    fireEvent.press(screen.getByTestId('cancel-button'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockCancelMutate).toHaveBeenCalled();
    });
  });

  it('refetches when pull-to-refresh fires', () => {
    mockRequests = [createRequest()];
    const { UNSAFE_getByType } = renderWithProviders(<BorrowRequestsScreen />);
    const flatList = UNSAFE_getByType(FlatList);
    const refreshControl = flatList.props.refreshControl;
    refreshControl.props.onRefresh();
    expect(mockRefetch).toHaveBeenCalled();
  });
});
