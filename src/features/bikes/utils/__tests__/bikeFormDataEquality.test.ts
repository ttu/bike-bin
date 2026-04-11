import { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../../types';
import { areBikeFormDataEqual } from '../bikeFormDataEquality';

const base: BikeFormData = {
  name: 'My bike',
  type: BikeType.Road,
  condition: ItemCondition.Good,
};

describe('areBikeFormDataEqual', () => {
  it('returns true for identical data', () => {
    expect(areBikeFormDataEqual(base, { ...base })).toBe(true);
  });

  it('detects field changes', () => {
    expect(areBikeFormDataEqual(base, { ...base, name: 'Other' })).toBe(false);
  });

  it('treats missing optional strings as equal', () => {
    const a: BikeFormData = { ...base, notes: undefined };
    const b: BikeFormData = { ...base, notes: undefined };
    expect(areBikeFormDataEqual(a, b)).toBe(true);
  });
});
