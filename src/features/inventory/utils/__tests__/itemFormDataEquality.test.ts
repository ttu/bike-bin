import { AvailabilityType, ItemCategory, ItemCondition, Visibility } from '@/shared/types';
import type { ItemFormData } from '../validation';
import { areItemFormDataEqual } from '../itemFormDataEquality';

const base: ItemFormData = {
  name: 'Test part',
  quantity: 1,
  category: ItemCategory.Component,
  condition: ItemCondition.New,
  availabilityTypes: [AvailabilityType.Private],
  visibility: Visibility.Private,
  tags: ['a', 'b'],
};

describe('areItemFormDataEqual', () => {
  it('returns true for identical snapshots', () => {
    expect(areItemFormDataEqual(base, { ...base })).toBe(true);
  });

  it('treats availability type order as irrelevant', () => {
    const a: ItemFormData = {
      ...base,
      availabilityTypes: [AvailabilityType.Sellable, AvailabilityType.Private],
    };
    const b: ItemFormData = {
      ...base,
      availabilityTypes: [AvailabilityType.Private, AvailabilityType.Sellable],
    };
    expect(areItemFormDataEqual(a, b)).toBe(true);
  });

  it('detects name changes', () => {
    expect(areItemFormDataEqual(base, { ...base, name: 'Other' })).toBe(false);
  });

  it('detects tag set changes ignoring order', () => {
    const a: ItemFormData = { ...base, tags: ['x', 'y'] };
    const b: ItemFormData = { ...base, tags: ['y', 'x'] };
    expect(areItemFormDataEqual(a, b)).toBe(true);
  });
});
