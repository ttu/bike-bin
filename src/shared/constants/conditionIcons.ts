import { ItemCondition } from '@/shared/types';

/**
 * MaterialCommunityIcons name for each item/bike condition. Used by
 * ItemForm, BikeForm, and ListingDetail. Centralised to keep the chip
 * row icons consistent and to make adding a new condition a one-line
 * change rather than a three-file change.
 */
export const CONDITION_ICON: Record<ItemCondition, string> = {
  [ItemCondition.New]: 'shield-check',
  [ItemCondition.Good]: 'emoticon-happy-outline',
  [ItemCondition.Worn]: 'history',
  [ItemCondition.Broken]: 'close-circle-outline',
};

/** Fallback icon when a string is not a known `ItemCondition`. */
export const CONDITION_ICON_FALLBACK = 'shield-check';
