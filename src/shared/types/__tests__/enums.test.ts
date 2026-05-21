import {
  ItemCategory,
  ItemCondition,
  ItemStatus,
  AvailabilityType,
  Visibility,
  BorrowRequestStatus,
  GroupRole,
  BikeType,
  TransactionType,
} from '../enums';

describe('ItemCategory', () => {
  it('has correct keys and values', () => {
    expect(ItemCategory.Component).toBe('component');
    expect(ItemCategory.Tool).toBe('tool');
    expect(ItemCategory.Accessory).toBe('accessory');
    expect(ItemCategory.Consumable).toBe('consumable');
    expect(ItemCategory.Clothing).toBe('clothing');
    expect(ItemCategory.Bike).toBe('bike');
  });

  it('has exactly 6 entries', () => {
    expect(Object.keys(ItemCategory)).toHaveLength(6);
  });
});

describe('ItemCondition', () => {
  it('has correct keys and values', () => {
    expect(ItemCondition.New).toBe('new');
    expect(ItemCondition.Good).toBe('good');
    expect(ItemCondition.Worn).toBe('worn');
    expect(ItemCondition.Broken).toBe('broken');
  });

  it('has exactly 4 entries', () => {
    expect(Object.keys(ItemCondition)).toHaveLength(4);
  });
});

describe('ItemStatus', () => {
  it('has correct keys and values', () => {
    expect(ItemStatus.Stored).toBe('stored');
    expect(ItemStatus.Mounted).toBe('mounted');
    expect(ItemStatus.Loaned).toBe('loaned');
    expect(ItemStatus.Reserved).toBe('reserved');
    expect(ItemStatus.Donated).toBe('donated');
    expect(ItemStatus.Sold).toBe('sold');
    expect(ItemStatus.Archived).toBe('archived');
  });

  it('has exactly 7 entries', () => {
    expect(Object.keys(ItemStatus)).toHaveLength(7);
  });
});

describe('AvailabilityType', () => {
  it('has correct keys and values', () => {
    expect(AvailabilityType.Borrowable).toBe('borrowable');
    expect(AvailabilityType.Donatable).toBe('donatable');
    expect(AvailabilityType.Sellable).toBe('sellable');
    expect(AvailabilityType.Private).toBe('private');
  });

  it('has exactly 4 entries', () => {
    expect(Object.keys(AvailabilityType)).toHaveLength(4);
  });
});

describe('Visibility', () => {
  it('has correct keys and values', () => {
    expect(Visibility.Private).toBe('private');
    expect(Visibility.Groups).toBe('groups');
    expect(Visibility.All).toBe('all');
  });

  it('has exactly 3 entries', () => {
    expect(Object.keys(Visibility)).toHaveLength(3);
  });
});

describe('BorrowRequestStatus', () => {
  it('has correct keys and values', () => {
    expect(BorrowRequestStatus.Pending).toBe('pending');
    expect(BorrowRequestStatus.Accepted).toBe('accepted');
    expect(BorrowRequestStatus.Rejected).toBe('rejected');
    expect(BorrowRequestStatus.Returned).toBe('returned');
    expect(BorrowRequestStatus.Cancelled).toBe('cancelled');
  });

  it('has exactly 5 entries', () => {
    expect(Object.keys(BorrowRequestStatus)).toHaveLength(5);
  });
});

describe('GroupRole', () => {
  it('has correct keys and values', () => {
    expect(GroupRole.Admin).toBe('admin');
    expect(GroupRole.Member).toBe('member');
  });

  it('has exactly 2 entries', () => {
    expect(Object.keys(GroupRole)).toHaveLength(2);
  });
});

describe('BikeType', () => {
  it('has correct keys and values', () => {
    expect(BikeType.Road).toBe('road');
    expect(BikeType.Gravel).toBe('gravel');
    expect(BikeType.MTB).toBe('mtb');
    expect(BikeType.Cyclo).toBe('cyclo');
    expect(BikeType.Enduro).toBe('enduro');
    expect(BikeType.XC).toBe('xc');
    expect(BikeType.Downhill).toBe('downhill');
    expect(BikeType.BMX).toBe('bmx');
    expect(BikeType.Fatbike).toBe('fatbike');
    expect(BikeType.City).toBe('city');
    expect(BikeType.Touring).toBe('touring');
    expect(BikeType.Other).toBe('other');
  });

  it('has exactly 12 entries', () => {
    expect(Object.keys(BikeType)).toHaveLength(12);
  });
});

describe('TransactionType', () => {
  it('has correct keys and values', () => {
    expect(TransactionType.Borrow).toBe('borrow');
    expect(TransactionType.Donate).toBe('donate');
    expect(TransactionType.Sell).toBe('sell');
  });

  it('has exactly 3 entries', () => {
    expect(Object.keys(TransactionType)).toHaveLength(3);
  });
});
