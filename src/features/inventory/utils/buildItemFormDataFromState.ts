import { ItemCategory, ItemCondition, AvailabilityType, Visibility } from '@/shared/types';
import type { GroupId } from '@/shared/types';
import type { DistanceUnit } from '@/shared/types';
import type { LocationId } from '@/shared/types';
import { resolveItemFormName } from './resolveItemFormName';
import { parseRemainingPercentInput } from './remainingFractionInput';
import { sanitizeTag, canAddTag } from './tagUtils';
import { displayUnitToKm } from '@/shared/utils/distanceConversion';
import type { ItemFormData } from './validation';

export interface ItemFormDraftInput {
  name: string;
  quantityStr: string;
  category: ItemCategory | undefined;
  subcategory: string;
  condition: ItemCondition | undefined;
  brand: string;
  model: string;
  description: string;
  availabilityTypes: AvailabilityType[];
  price: string;
  deposit: string;
  borrowDuration: string;
  storageLocation: string;
  age: string;
  usage: string;
  remainingPercentStr: string;
  purchaseDate: string;
  mountedDate: string;
  visibility: Visibility;
  groupIds: GroupId[];
  tags: string[];
  tagInput: string;
  distanceUnit: DistanceUnit;
  /** Columns the form does not edit; carried for parity with loaded rows (e.g. pickup location). */
  pickupLocationId?: LocationId;
}

export function buildItemFormDataFromState(state: ItemFormDraftInput): ItemFormData {
  const pendingTag = sanitizeTag(state.tagInput);
  const tagsToSubmit = canAddTag(pendingTag, state.tags) ? [...state.tags, pendingTag] : state.tags;

  const parsedRemaining =
    state.category === ItemCategory.Consumable
      ? parseRemainingPercentInput(state.remainingPercentStr)
      : undefined;

  const parsedQuantity = Number.parseInt(state.quantityStr.trim(), 10);

  const resolvedName = resolveItemFormName(state.name, state.brand, state.model);

  const isSellable = state.availabilityTypes.includes(AvailabilityType.Sellable);
  const isBorrowable = state.availabilityTypes.includes(AvailabilityType.Borrowable);

  return {
    name: resolvedName,
    quantity: Number.isNaN(parsedQuantity) ? undefined : parsedQuantity,
    category: state.category,
    subcategory: state.subcategory || undefined,
    condition: state.category === ItemCategory.Consumable ? ItemCondition.Good : state.condition,
    brand: state.brand || undefined,
    model: state.model || undefined,
    description: state.description || undefined,
    availabilityTypes: state.availabilityTypes,
    price: isSellable && state.price ? Number.parseFloat(state.price) : undefined,
    deposit: isBorrowable && state.deposit ? Number.parseFloat(state.deposit) : undefined,
    borrowDuration: isBorrowable && state.borrowDuration ? state.borrowDuration : undefined,
    storageLocation: state.storageLocation || undefined,
    age: state.age || undefined,
    usageKm: (() => {
      const raw = state.usage.trim();
      if (!raw) return undefined;
      const n = Number.parseFloat(raw.replace(',', '.'));
      if (!Number.isFinite(n)) return undefined;
      return displayUnitToKm(n, state.distanceUnit);
    })(),
    remainingFraction: parsedRemaining,
    purchaseDate: state.purchaseDate.trim() || undefined,
    mountedDate: state.mountedDate.trim() || undefined,
    visibility: state.visibility,
    groupIds: state.visibility === Visibility.Groups ? state.groupIds : undefined,
    tags: tagsToSubmit,
    pickupLocationId: state.pickupLocationId,
  };
}
