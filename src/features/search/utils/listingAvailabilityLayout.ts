import { AvailabilityType } from '@/shared/types';
import type { SearchResultItem } from '../types';

/** Derives borrow/contact button layout from item availability types (search listing detail). */
export function listingAvailabilityLayout(types: SearchResultItem['availabilityTypes']) {
  const hasBorrowable = types.includes(AvailabilityType.Borrowable);
  const hasDonatable = types.includes(AvailabilityType.Donatable);
  const hasSellable = types.includes(AvailabilityType.Sellable);
  const hasContactable = hasDonatable || hasSellable;
  return {
    hasBorrowable,
    showBorrowOnly: hasBorrowable && !hasContactable,
    showContactOnly: hasContactable && !hasBorrowable,
    showBoth: hasBorrowable && hasContactable,
  };
}
