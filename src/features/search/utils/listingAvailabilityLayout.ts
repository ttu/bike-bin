import type { SearchResultItem } from '../types';

/** Derives borrow/contact button layout from item availability types (search listing detail). */
export function listingAvailabilityLayout(types: SearchResultItem['availabilityTypes']) {
  const hasBorrowable = types.includes('borrowable' as never);
  const hasDonatable = types.includes('donatable' as never);
  const hasSellable = types.includes('sellable' as never);
  const hasContactable = hasDonatable || hasSellable;
  return {
    hasBorrowable,
    showBorrowOnly: hasBorrowable && !hasContactable,
    showContactOnly: hasContactable && !hasBorrowable,
    showBoth: hasBorrowable && hasContactable,
  };
}
