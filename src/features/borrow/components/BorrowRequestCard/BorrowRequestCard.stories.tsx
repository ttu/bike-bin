import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import {
  AvailabilityType,
  BorrowRequestStatus,
  ItemStatus,
  type ItemId,
  type UserId,
} from '@/shared/types';
import { createMockBorrowRequest } from '@/test/factories';
import type { BorrowRequestWithDetails } from '../../types';
import { BorrowRequestCard } from './BorrowRequestCard';

const meta = {
  title: 'Borrow/BorrowRequestCard',
  component: BorrowRequestCard,
} satisfies Meta<typeof BorrowRequestCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const ownerId = 'owner-1' as UserId;
const requesterId = 'requester-1' as UserId;
const itemId = 'item-1' as ItemId;

const pendingIncoming: BorrowRequestWithDetails = {
  ...createMockBorrowRequest({
    itemId,
    requesterId,
    status: BorrowRequestStatus.Pending,
  }),
  itemName: 'Floor pump',
  itemStatus: ItemStatus.Stored,
  itemOwnerId: ownerId,
  itemAvailabilityTypes: [AvailabilityType.Borrowable],
  requesterName: 'Alex Rider',
  requesterAvatarUrl: undefined,
  ownerName: 'You',
  ownerAvatarUrl: undefined,
};

export const IncomingPending: Story = {
  args: {
    request: pendingIncoming,
    currentUserId: ownerId,
    onAccept: fn(),
    onDecline: fn(),
    onPress: fn(),
  },
};
