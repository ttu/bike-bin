import type { AvailabilityType, BorrowRequest, ItemStatus, UserId } from '@/shared/types';

export interface BorrowRequestWithDetails extends BorrowRequest {
  itemName: string;
  itemStatus: ItemStatus;
  itemOwnerId: UserId;
  itemAvailabilityTypes: AvailabilityType[];
  requesterName: string | undefined;
  requesterAvatarUrl: string | undefined;
  ownerName: string | undefined;
  ownerAvatarUrl: string | undefined;
}
