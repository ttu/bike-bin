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
  usageKm?: number;
  /** Consumables: fraction remaining 0–1 */
  remainingFraction?: number;
  purchaseDate?: string;
  mountedDate?: string;
  pickupLocationId?: LocationId;
  visibility?: Visibility;
  groupIds?: GroupId[];
  tags?: string[];
  /** Count of identical units (minimum 1). */
  quantity?: number;
}

export type ItemFormErrors = Partial<Record<keyof ItemFormData, string>>;

type Translator = (key: string) => string;

const ISO_CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True if value is undefined, blank, or a valid YYYY-MM-DD calendar date. */
function isValidOptionalCalendarDate(value: string | undefined): boolean {
  if (value === undefined) return true;
  const s = value.trim();
  if (s === '') return true;
  if (!ISO_CALENDAR_DATE.test(s)) return false;
  const [ys, ms, ds] = s.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateItem(data: ItemFormData, t: Translator): ItemFormErrors {
  const errors: ItemFormErrors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = t('validation.nameRequired');
  }

  if (data.quantity === undefined) {
    errors.quantity = t('validation.quantityRequired');
  } else if (!Number.isInteger(data.quantity) || data.quantity < 1) {
    errors.quantity = t('validation.quantityMin');
  } else if (data.quantity > 9999) {
    errors.quantity = t('validation.quantityMax');
  }

  if (!data.category) {
    errors.category = t('validation.categoryRequired');
  }

  const isConsumable = data.category === ItemCategoryEnum.Consumable;

  if (!isConsumable && !data.condition) {
    errors.condition = t('validation.conditionRequired');
  }

  if (isConsumable) {
    if (data.remainingFraction === undefined) {
      errors.remainingFraction = t('validation.remainingRequired');
    } else if (data.remainingFraction < 0 || data.remainingFraction > 1) {
      errors.remainingFraction = t('validation.remainingRange');
    }
  }

  const isSellable = data.availabilityTypes.includes(AvailabilityTypeEnum.Sellable);
  if (isSellable && (data.price === undefined || data.price === null)) {
    errors.price = t('validation.priceRequired');
  } else if (data.price !== undefined && data.price < 0) {
    errors.price = t('validation.pricePositive');
  }

  if (data.deposit !== undefined && data.deposit < 0) {
    errors.deposit = t('validation.depositPositive');
  }

  // Groups visibility requires at least one group selected
  if (data.visibility === VisibilityEnum.Groups && (!data.groupIds || data.groupIds.length === 0)) {
    errors.groupIds = t('validation.groupRequired');
  }

  if (!isValidOptionalCalendarDate(data.purchaseDate)) {
    errors.purchaseDate = t('validation.dateInvalid');
  }
  if (!isValidOptionalCalendarDate(data.mountedDate)) {
    errors.mountedDate = t('validation.dateInvalid');
  }

  return errors;
}
