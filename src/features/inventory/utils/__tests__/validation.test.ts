import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { validateItem, type ItemFormData } from '../validation';

function validFormData(overrides?: Partial<ItemFormData>): ItemFormData {
  return {
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    condition: ItemCondition.Good,
    availabilityTypes: [AvailabilityType.Borrowable],
    ...overrides,
  };
}

describe('validateItem', () => {
  it('returns no errors for valid data', () => {
    const errors = validateItem(validFormData());
    expect(errors).toEqual({});
  });

  it('requires name', () => {
    const errors = validateItem(validFormData({ name: '' }));
    expect(errors.name).toBeDefined();
  });

  it('requires name to not be only whitespace', () => {
    const errors = validateItem(validFormData({ name: '   ' }));
    expect(errors.name).toBeDefined();
  });

  it('requires category', () => {
    const errors = validateItem(validFormData({ category: undefined }));
    expect(errors.category).toBeDefined();
  });

  it('requires condition', () => {
    const errors = validateItem(validFormData({ condition: undefined }));
    expect(errors.condition).toBeDefined();
  });

  it('requires price when sellable', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Sellable],
        price: undefined,
      }),
    );
    expect(errors.price).toBeDefined();
  });

  it('does not require price when not sellable', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Borrowable],
        price: undefined,
      }),
    );
    expect(errors.price).toBeUndefined();
  });

  it('rejects negative price', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Sellable],
        price: -5,
      }),
    );
    expect(errors.price).toBeDefined();
  });

  it('accepts valid price for sellable', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Sellable],
        price: 25.5,
      }),
    );
    expect(errors.price).toBeUndefined();
  });

  it('rejects negative deposit', () => {
    const errors = validateItem(
      validFormData({
        deposit: -10,
      }),
    );
    expect(errors.deposit).toBeDefined();
  });

  it('returns multiple errors at once', () => {
    const errors = validateItem(
      validFormData({
        name: '',
        category: undefined,
        condition: undefined,
      }),
    );
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(3);
  });
});
