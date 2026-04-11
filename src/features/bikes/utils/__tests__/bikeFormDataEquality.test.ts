import { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../../types';
import { areBikeFormDataEqual } from '../bikeFormDataEquality';

const base: BikeFormData = {
  name: 'Bike',
  brand: 'Brand',
  model: 'Model',
  type: BikeType.Road,
  year: 2020,
  distanceKm: 100,
  usageHours: 10,
  condition: ItemCondition.Good,
  notes: 'Note',
};

describe('areBikeFormDataEqual', () => {
  it('returns true for identical data', () => {
    expect(areBikeFormDataEqual(base, { ...base })).toBe(true);
  });

  it('treats undefined year equal to undefined when both omit year', () => {
    const a: BikeFormData = { ...base, year: undefined };
    const b: BikeFormData = { ...base, year: undefined };
    expect(areBikeFormDataEqual(a, b)).toBe(true);
  });
});
