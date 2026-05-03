import type { TFunction } from 'i18next';
import { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../../types';
import { validateBikeForm, type BikeFormValidationInput } from '../bikeFormValidation';

const t = ((key: string) => key) as unknown as TFunction<'bikes'>;

const baseData: BikeFormData = {
  name: 'Trail Bike',
  brand: 'Trek',
  model: 'Fuel EX',
  type: BikeType.MTB,
  year: undefined,
  distanceKm: 120,
  usageHours: 40,
  condition: ItemCondition.Good,
  notes: undefined,
};

const baseInput: BikeFormValidationInput = {
  data: baseData,
  distanceKmStr: '120',
  usageHoursStr: '40',
};

describe('validateBikeForm', () => {
  it('returns no errors when all fields are valid', () => {
    expect(validateBikeForm(baseInput, t)).toEqual({});
  });

  it('flags a missing name when the resolved name is empty', () => {
    const errors = validateBikeForm(
      {
        ...baseInput,
        data: { ...baseData, name: '', brand: undefined, model: undefined },
      },
      t,
    );
    expect(errors.name).toBe('form.nameRequired');
  });

  it('does not flag name when the resolved name is present', () => {
    expect(
      validateBikeForm({ ...baseInput, data: { ...baseData, name: 'Trek' } }, t).name,
    ).toBeUndefined();
  });

  it('flags a missing bike type', () => {
    const errors = validateBikeForm({ ...baseInput, data: { ...baseData, type: undefined } }, t);
    expect(errors.type).toBe('form.typeRequired');
  });

  it('flags an invalid distance value (undefined parsed value with non-empty raw input)', () => {
    const errors = validateBikeForm(
      { ...baseInput, data: { ...baseData, distanceKm: undefined }, distanceKmStr: 'abc' },
      t,
    );
    expect(errors.distanceKm).toBe('form.distanceInvalid');
  });

  it('flags invalid usage hours (undefined parsed value with non-empty raw input)', () => {
    const errors = validateBikeForm(
      { ...baseInput, data: { ...baseData, usageHours: undefined }, usageHoursStr: 'not-a-number' },
      t,
    );
    expect(errors.usageHours).toBe('form.hoursInvalid');
  });

  it('accepts blank numeric inputs (treated as undefined, not invalid)', () => {
    const errors = validateBikeForm(
      {
        ...baseInput,
        data: { ...baseData, distanceKm: undefined, usageHours: undefined },
        distanceKmStr: '',
        usageHoursStr: '',
      },
      t,
    );
    expect(errors.distanceKm).toBeUndefined();
    expect(errors.usageHours).toBeUndefined();
  });

  it('accepts whitespace-only numeric inputs', () => {
    const errors = validateBikeForm(
      {
        ...baseInput,
        data: { ...baseData, distanceKm: undefined, usageHours: undefined },
        distanceKmStr: '   ',
        usageHoursStr: '\t',
      },
      t,
    );
    expect(errors.distanceKm).toBeUndefined();
    expect(errors.usageHours).toBeUndefined();
  });
});
