import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { BorrowRequestCard } from '../BorrowRequestCard/BorrowRequestCard';
import type { BorrowRequestWithDetails } from '../../types';
import {
  AvailabilityType,
  BorrowRequestStatus,
  ItemStatus,
  type BorrowRequestId,
  type ItemId,
  type UserId,
} from '@/shared/types';

const CURRENT_USER_ID = 'current-user' as UserId;
const OTHER_USER_ID = 'other-user' as UserId;

function createRequest(overrides?: Partial<BorrowRequestWithDetails>): BorrowRequestWithDetails {
  return {
    id: 'req-1' as BorrowRequestId,
    itemId: 'item-1' as ItemId,
    requesterId: OTHER_USER_ID,
    status: BorrowRequestStatus.Pending,
    message: undefined,
    actedBy: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemName: 'Shimano XT Derailleur',
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

describe('BorrowRequestCard', () => {
  describe('incoming request (current user is owner)', () => {
    it('renders requester name and item name', () => {
      const request = createRequest();
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText(/Requested by Alice/)).toBeTruthy();
      expect(getByText('Shimano XT Derailleur')).toBeTruthy();
    });

    it('shows pending status badge', () => {
      const request = createRequest({ status: BorrowRequestStatus.Pending });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText('Pending')).toBeTruthy();
    });

    it('shows Accept and Decline buttons for pending request', () => {
      const request = createRequest({ status: BorrowRequestStatus.Pending });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByTestId('accept-button')).toBeTruthy();
      expect(getByTestId('decline-button')).toBeTruthy();
    });

    it('fires onAccept when Accept is pressed', () => {
      const request = createRequest({ status: BorrowRequestStatus.Pending });
      const onAccept = jest.fn();
      const { getByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} onAccept={onAccept} />,
      );
      fireEvent.press(getByTestId('accept-button'));
      expect(onAccept).toHaveBeenCalledWith(request);
    });

    it('fires onDecline when Decline is pressed', () => {
      const request = createRequest({ status: BorrowRequestStatus.Pending });
      const onDecline = jest.fn();
      const { getByTestId } = renderWithProviders(
        <BorrowRequestCard
          request={request}
          currentUserId={CURRENT_USER_ID}
          onDecline={onDecline}
        />,
      );
      fireEvent.press(getByTestId('decline-button'));
      expect(onDecline).toHaveBeenCalledWith(request);
    });

    it('shows Mark Returned button for accepted/loaned request', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Accepted,
        itemStatus: ItemStatus.Loaned,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByTestId('mark-returned-button')).toBeTruthy();
    });

    it('fires onMarkReturned when Mark Returned is pressed', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Accepted,
        itemStatus: ItemStatus.Loaned,
      });
      const onMarkReturned = jest.fn();
      const { getByTestId } = renderWithProviders(
        <BorrowRequestCard
          request={request}
          currentUserId={CURRENT_USER_ID}
          onMarkReturned={onMarkReturned}
        />,
      );
      fireEvent.press(getByTestId('mark-returned-button'));
      expect(onMarkReturned).toHaveBeenCalledWith(request);
    });
  });

  describe('outgoing request (current user is requester)', () => {
    it('renders owner name and item name', () => {
      const request = createRequest({
        requesterId: CURRENT_USER_ID,
        itemOwnerId: OTHER_USER_ID,
        ownerName: 'Charlie',
      });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText(/From Charlie/)).toBeTruthy();
      expect(getByText('Shimano XT Derailleur')).toBeTruthy();
    });

    it('shows Cancel Request button for pending outgoing request', () => {
      const request = createRequest({
        requesterId: CURRENT_USER_ID,
        itemOwnerId: OTHER_USER_ID,
        status: BorrowRequestStatus.Pending,
      });
      const { getByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByTestId('cancel-button')).toBeTruthy();
    });

    it('fires onCancel when Cancel Request is pressed', () => {
      const request = createRequest({
        requesterId: CURRENT_USER_ID,
        itemOwnerId: OTHER_USER_ID,
        status: BorrowRequestStatus.Pending,
      });
      const onCancel = jest.fn();
      const { getByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} onCancel={onCancel} />,
      );
      fireEvent.press(getByTestId('cancel-button'));
      expect(onCancel).toHaveBeenCalledWith(request);
    });
  });

  describe('status display', () => {
    it('shows accepted status badge', () => {
      const request = createRequest({
        status: BorrowRequestStatus.Accepted,
        itemStatus: ItemStatus.Loaned,
      });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText('Accepted')).toBeTruthy();
    });

    it('shows declined status badge', () => {
      const request = createRequest({ status: BorrowRequestStatus.Rejected });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText('Declined')).toBeTruthy();
    });

    it('shows returned status badge', () => {
      const request = createRequest({ status: BorrowRequestStatus.Returned });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText('Returned')).toBeTruthy();
    });

    it('shows cancelled status badge', () => {
      const request = createRequest({ status: BorrowRequestStatus.Cancelled });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText('Cancelled')).toBeTruthy();
    });
  });

  describe('message display', () => {
    it('shows request message when present', () => {
      const request = createRequest({ message: 'Could I borrow this for the weekend?' });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText(/"Could I borrow this for the weekend\?"/)).toBeTruthy();
    });

    it('does not show message section when no message', () => {
      const request = createRequest({ message: undefined });
      const { queryByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      // Should not contain quoted message text
      expect(queryByText(/^"/)).toBeNull();
    });
  });

  describe('no action buttons for terminal states', () => {
    it('shows no action buttons for declined request', () => {
      const request = createRequest({ status: BorrowRequestStatus.Rejected });
      const { queryByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(queryByTestId('accept-button')).toBeNull();
      expect(queryByTestId('decline-button')).toBeNull();
      expect(queryByTestId('cancel-button')).toBeNull();
      expect(queryByTestId('mark-returned-button')).toBeNull();
    });

    it('shows no action buttons for returned request', () => {
      const request = createRequest({ status: BorrowRequestStatus.Returned });
      const { queryByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(queryByTestId('accept-button')).toBeNull();
      expect(queryByTestId('decline-button')).toBeNull();
      expect(queryByTestId('cancel-button')).toBeNull();
      expect(queryByTestId('mark-returned-button')).toBeNull();
    });

    it('shows no action buttons for cancelled request', () => {
      const request = createRequest({ status: BorrowRequestStatus.Cancelled });
      const { queryByTestId } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(queryByTestId('accept-button')).toBeNull();
      expect(queryByTestId('decline-button')).toBeNull();
      expect(queryByTestId('cancel-button')).toBeNull();
      expect(queryByTestId('mark-returned-button')).toBeNull();
    });
  });

  describe('interaction', () => {
    it('fires onPress when card is pressed', () => {
      const request = createRequest();
      const onPress = jest.fn();
      const { getByLabelText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} onPress={onPress} />,
      );
      fireEvent.press(getByLabelText(/Shimano XT Derailleur/));
      expect(onPress).toHaveBeenCalledWith(request);
    });
  });

  describe('timestamp', () => {
    it('shows relative timestamp', () => {
      const request = createRequest({ createdAt: new Date().toISOString() });
      const { getByText } = renderWithProviders(
        <BorrowRequestCard request={request} currentUserId={CURRENT_USER_ID} />,
      );
      expect(getByText(/Requested just now/)).toBeTruthy();
    });
  });
});
