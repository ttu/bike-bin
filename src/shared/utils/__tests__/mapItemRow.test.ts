import { mapItemRow } from '../mapItemRow';
import {
  ItemCategory,
  ItemCondition,
  ItemStatus,
  AvailabilityType,
  Visibility,
} from '@/shared/types';
import type { ItemRow } from '@/shared/types';

const baseRow: ItemRow = {
  id: 'item-1',
  owner_id: 'owner-1',
  group_id: null,
  created_by: null,
  bike_id: null,
  name: 'Chain lube',
  category: ItemCategory.Consumable,
  subcategory: null,
  brand: null,
  model: null,
  description: null,
  condition: ItemCondition.New,
  quantity: 1,
  status: ItemStatus.Stored,
  availability_types: [AvailabilityType.Private],
  price: null,
  deposit: null,
  borrow_duration: null,
  storage_location: null,
  age: null,
  usage_km: null,
  remaining_fraction: null,
  purchase_date: null,
  mounted_date: null,
  pickup_location_id: null,
  visibility: Visibility.Private,
  tags: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('mapItemRow', () => {
  it('treats usageKm as unset when usage_km is null', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i1',
      owner_id: 'u1',
      usage_km: null,
    });

    expect(item.usageKm).toBeUndefined();
  });

  it('maps usageKm when usage_km is set', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i2',
      owner_id: 'u1',
      usage_km: 1200,
    });

    expect(item.usageKm).toBe(1200);
  });

  it('keeps usageKm 0 as a real value', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i3',
      owner_id: 'u1',
      usage_km: 0,
    });

    expect(item.usageKm).toBe(0);
  });

  it('treats remaining_fraction null as unset', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i4',
      owner_id: 'u1',
      remaining_fraction: null,
    });
    expect(item.remainingFraction).toBeUndefined();
  });

  it('maps remaining_fraction when set', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i5',
      owner_id: 'u1',
      remaining_fraction: 0.25,
    });
    expect(item.remainingFraction).toBe(0.25);
  });

  it('maps quantity when set', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i6',
      owner_id: 'u1',
      quantity: 4,
    });
    expect(item.quantity).toBe(4);
  });

  it('defaults quantity to 1 when column is missing', () => {
    const row = { ...baseRow, id: 'i7', owner_id: 'u1' };
    delete (row as Record<string, unknown>).quantity;
    const item = mapItemRow(row);
    expect(item.quantity).toBe(1);
  });

  it('maps purchase_date and mounted_date when set', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i8',
      owner_id: 'u1',
      purchase_date: '2023-06-01',
      mounted_date: '2024-01-20',
    });

    expect(item.purchaseDate).toBe('2023-06-01');
    expect(item.mountedDate).toBe('2024-01-20');
  });

  it('treats mounted_date null as unset', () => {
    const item = mapItemRow({
      ...baseRow,
      id: 'i9',
      owner_id: 'u1',
      mounted_date: null,
    });
    expect(item.mountedDate).toBeUndefined();
  });
});
