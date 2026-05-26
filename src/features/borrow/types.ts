import type { AvailabilityType, BorrowRequest, GroupId, ItemStatus, UserId } from '@/shared/types';

export interface BorrowRequestWithDetails extends BorrowRequest {
  itemName: string;
  itemStatus: ItemStatus;
  itemOwnerId: UserId;
  itemGroupId: GroupId | undefined;
  itemAvailabilityTypes: AvailabilityType[];
  requesterName: string | undefined;
  requesterAvatarUrl: string | undefined;
  ownerName: string | undefined;
  ownerAvatarUrl: string | undefined;
}
