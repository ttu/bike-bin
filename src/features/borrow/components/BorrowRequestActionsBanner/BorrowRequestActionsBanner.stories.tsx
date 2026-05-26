import type { Meta, StoryObj } from '@storybook/react-native';
import {
  AvailabilityType,
  BorrowRequestStatus,
  ItemStatus,
  type BorrowRequestId,
  type ItemId,
  type UserId,
} from '@/shared/types';
import { createMockBorrowRequest } from '@/test/factories';
import type { BorrowRequestWithDetails } from '../../types';
import { BorrowRequestActionsBanner } from './BorrowRequestActionsBanner';

const meta = {
  title: 'Borrow/BorrowRequestActionsBanner',
  component: BorrowRequestActionsBanner,
} satisfies Meta<typeof BorrowRequestActionsBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

const ownerId = 'owner-1' as UserId;
const requesterId = 'requester-1' as UserId;
const itemId = 'item-1' as ItemId;

function makeRequest(overrides: Partial<BorrowRequestWithDetails>): BorrowRequestWithDetails {
  return {
    ...createMockBorrowRequest({ itemId, requesterId }),
    itemName: 'Floor pump',
    itemStatus: ItemStatus.Stored,
    itemOwnerId: ownerId,
    itemGroupId: undefined,
    itemAvailabilityTypes: [AvailabilityType.Borrowable],
    requesterName: 'Alex Rider',
    requesterAvatarUrl: undefined,
    ownerName: 'Sam Owner',
    ownerAvatarUrl: undefined,
    id: 'req-story-1' as BorrowRequestId,
    ...overrides,
  };
}

const pendingOwner = makeRequest({
  status: BorrowRequestStatus.Pending,
  itemStatus: ItemStatus.Stored,
});

const acceptedOwner = makeRequest({
  status: BorrowRequestStatus.Accepted,
  itemStatus: ItemStatus.Loaned,
});

const pendingRequester = makeRequest({
  status: BorrowRequestStatus.Pending,
  itemStatus: ItemStatus.Stored,
});

export const Default: Story = {
  name: 'Pending (owner)',
  args: {
    request: pendingOwner,
    currentUserId: ownerId,
  },
};

export const Accepted: Story = {
  name: 'Accepted (owner, item loaned)',
  args: {
    request: acceptedOwner,
    currentUserId: ownerId,
  },
};

export const RequesterPending: Story = {
  name: 'Pending (requester)',
  args: {
    request: pendingRequester,
    currentUserId: requesterId,
  },
};
