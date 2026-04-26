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

function validateName(data: ItemFormData, t: Translator): string | undefined {
  if (!data.name || data.name.trim().length === 0) return t('validation.nameRequired');
  return undefined;
}

function validateQuantity(data: ItemFormData, t: Translator): string | undefined {
  if (data.quantity === undefined) return t('validation.quantityRequired');
  if (!Number.isInteger(data.quantity) || data.quantity < 1) return t('validation.quantityMin');
  if (data.quantity > 9999) return t('validation.quantityMax');
  return undefined;
}

function validateCondition(data: ItemFormData, t: Translator): string | undefined {
  const isConsumable = data.category === ItemCategoryEnum.Consumable;
  if (!isConsumable && !data.condition) return t('validation.conditionRequired');
  return undefined;
}

function validateRemainingFraction(data: ItemFormData, t: Translator): string | undefined {
  if (data.category !== ItemCategoryEnum.Consumable) return undefined;
  if (data.remainingFraction === undefined) return t('validation.remainingRequired');
  if (data.remainingFraction < 0 || data.remainingFraction > 1) {
    return t('validation.remainingRange');
  }
  return undefined;
}

function validatePrice(data: ItemFormData, t: Translator): string | undefined {
  const isSellable = data.availabilityTypes.includes(AvailabilityTypeEnum.Sellable);
  if (isSellable && (data.price === undefined || data.price === null)) {
    return t('validation.priceRequired');
  }
  if (data.price !== undefined && data.price < 0) return t('validation.pricePositive');
  return undefined;
}

function validateGroupIds(data: ItemFormData, t: Translator): string | undefined {
  if (data.visibility !== VisibilityEnum.Groups) return undefined;
  if (!data.groupIds || data.groupIds.length === 0) return t('validation.groupRequired');
  return undefined;
}

type FieldValidator = (data: ItemFormData, t: Translator) => string | undefined;

const FIELD_VALIDATORS: ReadonlyArray<readonly [keyof ItemFormErrors, FieldValidator]> = [
  ['name', validateName],
  ['quantity', validateQuantity],
  ['category', (d, t) => (d.category ? undefined : t('validation.categoryRequired'))],
  ['condition', validateCondition],
  ['remainingFraction', validateRemainingFraction],
  ['price', validatePrice],
  [
    'deposit',
    (d, t) =>
      d.deposit !== undefined && d.deposit < 0 ? t('validation.depositPositive') : undefined,
  ],
  ['groupIds', validateGroupIds],
  [
    'purchaseDate',
    (d, t) =>
      isValidOptionalCalendarDate(d.purchaseDate) ? undefined : t('validation.dateInvalid'),
  ],
  [
    'mountedDate',
    (d, t) =>
      isValidOptionalCalendarDate(d.mountedDate) ? undefined : t('validation.dateInvalid'),
  ],
];

export function validateItem(data: ItemFormData, t: Translator): ItemFormErrors {
  const errors: ItemFormErrors = {};
  for (const [field, validator] of FIELD_VALIDATORS) {
    const message = validator(data, t);
    if (message !== undefined) {
      (errors as Record<string, string>)[field] = message;
    }
  }
  return errors;
}
