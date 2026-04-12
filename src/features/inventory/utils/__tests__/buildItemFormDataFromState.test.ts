import {
  ItemCategory,
  ItemCondition,
  AvailabilityType,
  Visibility,
  DistanceUnit,
} from '@/shared/types';
import { buildItemFormDataFromState } from '../buildItemFormDataFromState';

const baseDraft = {
  name: 'Item',
  quantityStr: '1',
  category: ItemCategory.Component,
  subcategory: '  ',
  condition: ItemCondition.Good,
  brand: '  ',
  model: '',
  description: '  ',
  availabilityTypes: [AvailabilityType.Sellable, AvailabilityType.Borrowable],
  price: '10',
  deposit: '12.5',
  borrowDuration: '',
  storageLocation: '  ',
  age: '  ',
  usage: '',
  remainingPercentStr: '',
  purchaseDate: '',
  mountedDate: '',
  visibility: Visibility.Private,
  groupIds: [],
  tags: [],
  tagInput: '',
  distanceUnit: DistanceUnit.Km,
};

describe('buildItemFormDataFromState', () => {
  it('maps non-finite price to undefined for sellable items', () => {
    const data = buildItemFormDataFromState({
      ...baseDraft,
      price: 'xx',
    });
    expect(data.price).toBeUndefined();
  });

  it('maps finite price for sellable items', () => {
    const data = buildItemFormDataFromState({
      ...baseDraft,
      price: '19,99',
    });
    expect(data.price).toBeCloseTo(19.99);
  });

  it('maps non-finite deposit to undefined for borrowable items', () => {
    const data = buildItemFormDataFromState({
      ...baseDraft,
      deposit: 'bad',
    });
    expect(data.deposit).toBeUndefined();
  });

  it('trims whitespace-only optional strings to undefined', () => {
    const data = buildItemFormDataFromState(baseDraft);
    expect(data.subcategory).toBeUndefined();
    expect(data.brand).toBeUndefined();
    expect(data.description).toBeUndefined();
    expect(data.storageLocation).toBeUndefined();
    expect(data.age).toBeUndefined();
  });
});
