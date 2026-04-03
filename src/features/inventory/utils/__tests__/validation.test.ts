import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { validateItem, type ItemFormData } from '../validation';

const t = (key: string) => key;

function validFormData(overrides?: Partial<ItemFormData>): ItemFormData {
  return {
    name: 'Shimano Cassette',
    quantity: 1,
    category: ItemCategory.Component,
    condition: ItemCondition.Good,
    availabilityTypes: [AvailabilityType.Borrowable],
    ...overrides,
  };
}

describe('validateItem', () => {
  it('returns no errors for valid data', () => {
    const errors = validateItem(validFormData(), t);
    expect(errors).toEqual({});
  });

  it('requires quantity', () => {
    const errors = validateItem(validFormData({ quantity: undefined }), t);
    expect(errors.quantity).toBeDefined();
  });

  it('rejects quantity below 1', () => {
    const errors = validateItem(validFormData({ quantity: 0 }), t);
    expect(errors.quantity).toBeDefined();
  });

  it('rejects quantity above 9999', () => {
    const errors = validateItem(validFormData({ quantity: 10000 }), t);
    expect(errors.quantity).toBeDefined();
  });

  it('requires name', () => {
    const errors = validateItem(validFormData({ name: '' }), t);
    expect(errors.name).toBeDefined();
  });

  it('requires name to not be only whitespace', () => {
    const errors = validateItem(validFormData({ name: '   ' }), t);
    expect(errors.name).toBeDefined();
  });

  it('requires category', () => {
    const errors = validateItem(validFormData({ category: undefined }), t);
    expect(errors.category).toBeDefined();
  });

  it('requires condition for non-consumables', () => {
    const errors = validateItem(validFormData({ condition: undefined }), t);
    expect(errors.condition).toBeDefined();
  });

  it('does not require condition for consumables', () => {
    const errors = validateItem(
      validFormData({
        category: ItemCategory.Consumable,
        condition: undefined,
        remainingFraction: 0.5,
      }),
      t,
    );
    expect(errors.condition).toBeUndefined();
  });

  it('requires remaining fraction for consumables', () => {
    const errors = validateItem(
      validFormData({
        category: ItemCategory.Consumable,
        condition: undefined,
        remainingFraction: undefined,
      }),
      t,
    );
    expect(errors.remainingFraction).toBeDefined();
  });

  it('rejects consumable remaining fraction out of range', () => {
    const errors = validateItem(
      validFormData({
        category: ItemCategory.Consumable,
        remainingFraction: 1.5,
      }),
      t,
    );
    expect(errors.remainingFraction).toBeDefined();
  });

  it('requires price when sellable', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Sellable],
        price: undefined,
      }),
      t,
    );
    expect(errors.price).toBeDefined();
  });

  it('does not require price when not sellable', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Borrowable],
        price: undefined,
      }),
      t,
    );
    expect(errors.price).toBeUndefined();
  });

  it('rejects negative price', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Sellable],
        price: -5,
      }),
      t,
    );
    expect(errors.price).toBeDefined();
  });

  it('accepts valid price for sellable', () => {
    const errors = validateItem(
      validFormData({
        availabilityTypes: [AvailabilityType.Sellable],
        price: 25.5,
      }),
      t,
    );
    expect(errors.price).toBeUndefined();
  });

  it('rejects negative deposit', () => {
    const errors = validateItem(
      validFormData({
        deposit: -10,
      }),
      t,
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
      t,
    );
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(3);
  });

  it('accepts empty optional bought date (purchaseDate)', () => {
    const errors = validateItem(validFormData({ purchaseDate: undefined }), t);
    expect(errors.purchaseDate).toBeUndefined();
  });

  it('accepts valid ISO bought date', () => {
    const errors = validateItem(validFormData({ purchaseDate: '2024-03-15' }), t);
    expect(errors.purchaseDate).toBeUndefined();
  });

  it('rejects invalid bought date format', () => {
    const errors = validateItem(validFormData({ purchaseDate: '15/03/2024' }), t);
    expect(errors.purchaseDate).toBe('validation.dateInvalid');
  });

  it('accepts empty optional mounted date', () => {
    const errors = validateItem(validFormData({ mountedDate: undefined }), t);
    expect(errors.mountedDate).toBeUndefined();
  });

  it('accepts valid ISO mounted date', () => {
    const errors = validateItem(validFormData({ mountedDate: '2025-01-01' }), t);
    expect(errors.mountedDate).toBeUndefined();
  });

  it('rejects impossible calendar date', () => {
    const errors = validateItem(validFormData({ mountedDate: '2024-02-30' }), t);
    expect(errors.mountedDate).toBe('validation.dateInvalid');
  });
});
