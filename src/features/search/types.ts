import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { GroupId, ItemId, UserId, LocationId } from '@/shared/types';

export interface SearchFilters {
  query: string;
  maxDistanceKm: number;
  categories: ItemCategory[];
  conditions: ItemCondition[];
  offerTypes: AvailabilityType[];
  priceMin?: number;
  priceMax?: number;
  groupId?: GroupId;
  sortBy: SearchSortOption;
}

export type SearchSortOption = 'distance' | 'newest' | 'recently_available';

export const DISTANCE_PRESETS = [5, 10, 25, 50, 100] as const;
export type DistancePreset = (typeof DISTANCE_PRESETS)[number];

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  maxDistanceKm: 25,
  categories: [],
  conditions: [],
  offerTypes: [],
  sortBy: 'distance',
};

/** A search result item with distance and owner info joined. */
export interface SearchResultItem {
  id: ItemId;
  ownerId: UserId;
  name: string;
  category: ItemCategory;
  brand: string | undefined;
  model: string | undefined;
  description: string | undefined;
  condition: ItemCondition;
  availabilityTypes: AvailabilityType[];
  price: number | undefined;
  deposit: number | undefined;
  borrowDuration: string | undefined;
  visibility: string;
  pickupLocationId: LocationId | undefined;
  createdAt: string;
  updatedAt: string;
  distanceMeters: number | undefined;
  /** Owner display name, joined from profiles. */
  ownerDisplayName: string | undefined;
  /** Owner avatar URL. */
  ownerAvatarUrl: string | undefined;
  /** Owner average rating. */
  ownerRatingAvg: number;
  /** Owner rating count. */
  ownerRatingCount: number;
  /** Area name from the pickup location. */
  areaName: string | undefined;
  thumbnailStoragePath: string | undefined;
}
