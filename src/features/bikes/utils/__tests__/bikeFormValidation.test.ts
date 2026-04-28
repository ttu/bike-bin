import type { TFunction } from 'i18next';
import { BikeType } from '@/shared/types';
import { validateBikeForm, type BikeFormValidationInput } from '../bikeFormValidation';

const t = ((key: string) => key) as unknown as TFunction<'bikes'>;

const baseInput: BikeFormValidationInput = {
  name: 'Trail Bike',
  brand: 'Trek',
  model: 'Fuel EX',
  bikeType: BikeType.MTB,
  distanceKmStr: '120',
  usageHoursStr: '40',
};

describe('validateBikeForm', () => {
  it('returns no errors when all fields are valid', () => {
    expect(validateBikeForm(baseInput, t)).toEqual({});
  });

  it('flags a missing name when name, brand, and model are all blank', () => {
    const errors = validateBikeForm({ ...baseInput, name: '', brand: '', model: '' }, t);
    expect(errors.name).toBe('form.nameRequired');
  });

  it('does not flag name when only brand or model are provided (resolveFormName fallback)', () => {
    expect(validateBikeForm({ ...baseInput, name: '', model: '' }, t).name).toBeUndefined();
    expect(validateBikeForm({ ...baseInput, name: '', brand: '' }, t).name).toBeUndefined();
  });

  it('flags a missing bike type', () => {
    const errors = validateBikeForm({ ...baseInput, bikeType: undefined }, t);
    expect(errors.type).toBe('form.typeRequired');
  });

  it('flags an invalid distance value', () => {
    const errors = validateBikeForm({ ...baseInput, distanceKmStr: 'abc' }, t);
    expect(errors.distanceKm).toBe('form.distanceInvalid');
  });

  it('flags invalid usage hours', () => {
    const errors = validateBikeForm({ ...baseInput, usageHoursStr: 'not-a-number' }, t);
    expect(errors.usageHours).toBe('form.hoursInvalid');
  });

  it('accepts blank numeric inputs (treated as undefined, not invalid)', () => {
    const errors = validateBikeForm({ ...baseInput, distanceKmStr: '', usageHoursStr: '' }, t);
    expect(errors.distanceKm).toBeUndefined();
    expect(errors.usageHours).toBeUndefined();
  });
});
