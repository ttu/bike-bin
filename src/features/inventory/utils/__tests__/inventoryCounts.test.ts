import { computeInventoryCounts } from '../inventoryCounts';
import { createMockItem } from '@/test/factories';
import { AvailabilityType, ItemCategory, ItemStatus } from '@/shared/types';

describe('computeInventoryCounts', () => {
  const items = [
    createMockItem({
      category: ItemCategory.Component,
      status: ItemStatus.Mounted,
      availabilityTypes: [],
    }),
    createMockItem({
      category: ItemCategory.Component,
      status: ItemStatus.Stored,
      availabilityTypes: [AvailabilityType.Borrowable],
    }),
    createMockItem({
      category: ItemCategory.Tool,
      status: ItemStatus.Stored,
      availabilityTypes: [AvailabilityType.Sellable],
    }),
    createMockItem({
      category: ItemCategory.Tool,
      status: ItemStatus.Sold,
      availabilityTypes: [AvailabilityType.Sellable],
    }),
  ];

  it('counts all non-terminal items when no category is selected', () => {
    expect(computeInventoryCounts(items)).toEqual({
      items: 3,
      mounted: 1,
      listed: 2,
    });
  });

  it('scopes counts to the selected category', () => {
    expect(computeInventoryCounts(items, ItemCategory.Component)).toEqual({
      items: 2,
      mounted: 1,
      listed: 1,
    });
    expect(computeInventoryCounts(items, ItemCategory.Tool)).toEqual({
      items: 1,
      mounted: 0,
      listed: 1,
    });
  });

  it('returns zeros when selected category has no items', () => {
    expect(computeInventoryCounts(items, ItemCategory.Bike)).toEqual({
      items: 0,
      mounted: 0,
      listed: 0,
    });
  });
});
