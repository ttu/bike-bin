import { listingAvailabilityLayout } from './listingAvailabilityLayout';

describe('listingAvailabilityLayout', () => {
  it('borrow-only when only borrowable', () => {
    expect(listingAvailabilityLayout(['borrowable' as never])).toEqual({
      hasBorrowable: true,
      showBorrowOnly: true,
      showContactOnly: false,
      showBoth: false,
    });
  });

  it('contact + borrow when both borrowable and sellable', () => {
    expect(listingAvailabilityLayout(['borrowable', 'sellable'] as never[])).toEqual({
      hasBorrowable: true,
      showBorrowOnly: false,
      showContactOnly: false,
      showBoth: true,
    });
  });
});
