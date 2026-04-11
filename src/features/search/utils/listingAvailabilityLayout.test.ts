import { AvailabilityType } from '@/shared/types';
import { listingAvailabilityLayout } from './listingAvailabilityLayout';

describe('listingAvailabilityLayout', () => {
  it('borrow-only when only borrowable', () => {
    const types: Parameters<typeof listingAvailabilityLayout>[0] = [AvailabilityType.Borrowable];
    expect(listingAvailabilityLayout(types)).toEqual({
      hasBorrowable: true,
      showBorrowOnly: true,
      showContactOnly: false,
      showBoth: false,
    });
  });

  it('contact + borrow when both borrowable and sellable', () => {
    const types: Parameters<typeof listingAvailabilityLayout>[0] = [
      AvailabilityType.Borrowable,
      AvailabilityType.Sellable,
    ];
    expect(listingAvailabilityLayout(types)).toEqual({
      hasBorrowable: true,
      showBorrowOnly: false,
      showContactOnly: false,
      showBoth: true,
    });
  });

  it('contact-only when sellable or donatable without borrowable', () => {
    const types: Parameters<typeof listingAvailabilityLayout>[0] = [AvailabilityType.Sellable];
    expect(listingAvailabilityLayout(types)).toEqual({
      hasBorrowable: false,
      showBorrowOnly: false,
      showContactOnly: true,
      showBoth: false,
    });
  });

  it('no borrow or contact affordances when only private', () => {
    const types: Parameters<typeof listingAvailabilityLayout>[0] = [AvailabilityType.Private];
    expect(listingAvailabilityLayout(types)).toEqual({
      hasBorrowable: false,
      showBorrowOnly: false,
      showContactOnly: false,
      showBoth: false,
    });
  });
});
