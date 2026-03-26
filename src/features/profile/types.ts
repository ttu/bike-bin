import type { UserId, ItemId } from '@/shared/types';
import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';

export interface PublicProfile {
  id: UserId;
  displayName: string | undefined;
  avatarUrl: string | undefined;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface PublicListing {
  id: ItemId;
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  availabilityTypes: AvailabilityType[];
  price: number | undefined;
  createdAt: string;
}
