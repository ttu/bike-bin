import type { ItemCategory, ItemCondition, AvailabilityType, Visibility } from '@/shared/types';
import { ItemCategory as ItemCategoryEnum } from '@/shared/types';
import {
  AvailabilityType as AvailabilityTypeEnum,
  Visibility as VisibilityEnum,
} from '@/shared/types';
import type { LocationId, GroupId } from '@/shared/types';

export interface ItemFormData {
  name: string;
  category?: ItemCategory;
  subcategory?: string;
  condition?: ItemCondition;
  brand?: string;
  model?: string;
  description?: string;
  availabilityTypes: AvailabilityType[];
  price?: number;
  deposit?: number;
  borrowDuration?: string;
  storageLocation?: string;
  age?: string;
  usage?: number;
  usageUnit?: string;
  /** Consumables: fraction remaining 0–1 */
  remainingFraction?: number;
  purchaseDate?: string;
  pickupLocationId?: LocationId;
  visibility?: Visibility;
  groupIds?: GroupId[];
  tags?: string[];
  /** Count of identical units (minimum 1). */
  quantity?: number;
}

export type ItemFormErrors = Partial<Record<keyof ItemFormData, string>>;

export function validateItem(data: ItemFormData): ItemFormErrors {
  const errors: ItemFormErrors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (data.quantity === undefined) {
    errors.quantity = 'Quantity is required';
  } else if (!Number.isInteger(data.quantity) || data.quantity < 1) {
    errors.quantity = 'Enter a whole number of at least 1';
  } else if (data.quantity > 9999) {
    errors.quantity = 'Quantity cannot exceed 9999';
  }

  if (!data.category) {
    errors.category = 'Category is required';
  }

  const isConsumable = data.category === ItemCategoryEnum.Consumable;

  if (!isConsumable && !data.condition) {
    errors.condition = 'Condition is required';
  }

  if (isConsumable) {
    if (data.remainingFraction === undefined) {
      errors.remainingFraction = 'Amount remaining is required';
    } else if (data.remainingFraction < 0 || data.remainingFraction > 1) {
      errors.remainingFraction = 'Enter a whole percent from 0 to 100';
    }
  }

  const isSellable = data.availabilityTypes.includes(AvailabilityTypeEnum.Sellable);
  if (isSellable && (data.price === undefined || data.price === null)) {
    errors.price = 'Price is required for sellable items';
  } else if (data.price !== undefined && data.price < 0) {
    errors.price = 'Price must be positive';
  }

  if (data.deposit !== undefined && data.deposit < 0) {
    errors.deposit = 'Deposit must be positive';
  }

  // Groups visibility requires at least one group selected
  if (data.visibility === VisibilityEnum.Groups && (!data.groupIds || data.groupIds.length === 0)) {
    errors.groupIds = 'Select at least one group';
  }

  return errors;
}
