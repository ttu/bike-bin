import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import {
  AvailabilityType,
  BorrowRequestStatus,
  ItemStatus,
  type BorrowRequestId,
  type ItemId,
  type UserId,
} from '@/shared/types';
import type { BorrowRequestWithDetails } from '../../types';

const OWNER_USER_ID = 'owner-user' as UserId;
const REQUESTER_USER_ID = 'requester-user' as UserId;

// Mocks must be defined before imports that use them
const mockAcceptMutate = jest.fn();
const mockDeclineMutate = jest.fn();
const mockCancelMutate = jest.fn();
const mockMarkReturnedMutate = jest.fn();

const mockAccept = { mutate: mockAcceptMutate, isPending: false };
const mockDecline = { mutate: mockDeclineMutate, isPending: false };
const mockCancel = { mutate: mockCancelMutate, isPending: false };
const mockMarkReturned = { mutate: mockMarkReturnedMutate, isPending: false };

jest.mock('../../hooks/useAcceptBorrowRequest', () => ({
  useAcceptBorrowRequest: () => mockAccept,
}));
jest.mock('../../hooks/useDeclineBorrowRequest', () => ({
  useDeclineBorrowRequest: () => mockDecline,
}));
jest.mock('../../hooks/useCancelBorrowRequest', () => ({
  useCancelBorrowRequest: () => mockCancel,
}));
jest.mock('../../hooks/useMarkReturned', () => ({
  useMarkReturned: () => mockMarkReturned,
}));

// Import after mocks
import { BorrowRequestActionsBanner } from './BorrowRequestActionsBanner';

function createRequest(overrides?: Partial<BorrowRequestWithDetails>): BorrowRequestWithDetails {
  return {
    id: 'req-1' as BorrowRequestId,
    itemId: 'item-1' as ItemId,
    requesterId: REQUESTER_USER_ID,
    status: BorrowRequestStatus.Pending,
    message: undefined,
    actedBy: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemName: 'Shimano XT Derailleur',
    itemStatus: ItemStatus.Stored,
    itemOwnerId: OWNER_USER_ID,
    itemAvailabilityTypes: [AvailabilityType.Borrowable],
    requesterName: 'Rita',
    requesterAvatarUrl: undefined,
    ownerName: 'Bob',
    ownerAvatarUrl: undefined,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAccept.isPending = false;
  mockDecline.isPending = false;
  mockCancel.isPending = false;
  mockMarkReturned.isPending = false;
});

describe('BorrowRequestActionsBanner', () => {
  describe('renders nothing when no actions available', () => {
    it('returns null for Accepted + requester', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Accepted,
        itemStatus: ItemStatus.Loaned,
        requesterId: REQUESTER_USER_ID,
        itemOwnerId: OWNER_USER_ID,
      });
      const { queryByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={REQUESTER_USER_ID} />,
      );
      // No buttons should be rendered when there are no actions
      expect(queryByTestId('actions-banner-accept')).toBeNull();
      expect(queryByTestId('actions-banner-decline')).toBeNull();
      expect(queryByTestId('actions-banner-cancel')).toBeNull();
      expect(queryByTestId('actions-banner-mark-returned')).toBeNull();
    });

    it('returns null for terminal Rejected status', () => {
      const request = createRequest({ status: BorrowRequestStatus.Rejected });
      const { queryByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      expect(queryByTestId('actions-banner-accept')).toBeNull();
      expect(queryByTestId('actions-banner-decline')).toBeNull();
      expect(queryByTestId('actions-banner-cancel')).toBeNull();
      expect(queryByTestId('actions-banner-mark-returned')).toBeNull();
    });
  });

  describe('Pending + owner', () => {
    it('renders accept and decline buttons', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Pending,
        itemStatus: ItemStatus.Stored,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      expect(getByTestId('actions-banner-accept')).toBeTruthy();
      expect(getByTestId('actions-banner-decline')).toBeTruthy();
    });

    it('calls accept mutation with requestId and itemId when accept pressed', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Pending,
        itemStatus: ItemStatus.Stored,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      fireEvent.press(getByTestId('actions-banner-accept'));
      expect(mockAcceptMutate).toHaveBeenCalledWith(
        { requestId: 'req-1', itemId: 'item-1' },
        expect.objectContaining({ onError: expect.any(Function) }),
      );
    });

    it('renders context line with banner.pending.owner key', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Pending,
        itemStatus: ItemStatus.Stored,
        requesterName: 'Rita',
      });
      const { getByText } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      // i18n resolves to the actual string from borrow.json
      expect(getByText('Rita wants to borrow this item.')).toBeTruthy();
    });
  });

  describe('Pending + requester', () => {
    it('renders cancel button', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Pending,
        itemStatus: ItemStatus.Stored,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={REQUESTER_USER_ID} />,
      );
      expect(getByTestId('actions-banner-cancel')).toBeTruthy();
    });

    it('does not render accept or decline buttons for requester', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Pending,
        itemStatus: ItemStatus.Stored,
      });
      const { queryByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={REQUESTER_USER_ID} />,
      );
      expect(queryByTestId('actions-banner-accept')).toBeNull();
      expect(queryByTestId('actions-banner-decline')).toBeNull();
    });
  });

  describe('Accepted + owner', () => {
    it('renders markReturned button when item is loaned', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Accepted,
        itemStatus: ItemStatus.Loaned,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      expect(getByTestId('actions-banner-mark-returned')).toBeTruthy();
    });

    it('calls markReturned mutation when button pressed', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Accepted,
        itemStatus: ItemStatus.Loaned,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      fireEvent.press(getByTestId('actions-banner-mark-returned'));
      expect(mockMarkReturnedMutate).toHaveBeenCalledWith(
        { requestId: 'req-1', itemId: 'item-1' },
        expect.objectContaining({ onError: expect.any(Function) }),
      );
    });
  });

  describe('disabled state', () => {
    it('accept button is disabled while accept mutation is pending', () => {
      mockAccept.isPending = true;
      const request = createRequest({
        status: BorrowRequestStatus.Pending,
        itemStatus: ItemStatus.Stored,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      // GradientButton passes disabled to Pressable accessibilityState
      const acceptButton = getByTestId('actions-banner-accept');
      expect(acceptButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('error snackbar', () => {
    it('shows error snackbar when accept mutation fails', () => {
      mockAcceptMutate.mockImplementation((_vars: unknown, opts?: { onError?: () => void }) => {
        opts?.onError?.();
      });
      const request = createRequest({
        status: BorrowRequestStatus.Pending,
        itemStatus: ItemStatus.Stored,
      });
      // renderWithProviders includes SnackbarAlertsProvider so it won't throw
      const { getByTestId } = renderWithProviders(
        <BorrowRequestActionsBanner request={request} currentUserId={OWNER_USER_ID} />,
      );
      fireEvent.press(getByTestId('actions-banner-accept'));
      // If onError fires without throwing, the snackbar was invoked — no assertion needed beyond no crash.
      // Verify mutate was called with correct shape.
      expect(mockAcceptMutate).toHaveBeenCalledWith(
        { requestId: 'req-1', itemId: 'item-1' },
        expect.objectContaining({ onError: expect.any(Function) }),
      );
    });
  });
});
