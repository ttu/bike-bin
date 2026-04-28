import type { TFunction } from 'i18next';
import { resolveFormName } from '@/shared/utils';
import type { BikeType } from '@/shared/types';
import { optionalNumberFromInput } from './optionalNumberFromInput';

export interface BikeFormErrors {
  name?: string;
  type?: string;
  distanceKm?: string;
  usageHours?: string;
}

export interface BikeFormValidationInput {
  name: string;
  brand: string;
  model: string;
  bikeType: BikeType | undefined;
  distanceKmStr: string;
  usageHoursStr: string;
}

/**
 * Validate the raw `BikeForm` input fields. Mirrors `validateItem` for the
 * inventory form: a pure function so it can be unit-tested without rendering
 * the component.
 */
export function validateBikeForm(
  input: BikeFormValidationInput,
  t: TFunction<'bikes'>,
): BikeFormErrors {
  const errors: BikeFormErrors = {};

  const resolvedName = resolveFormName(input.name, input.brand, input.model);
  if (!resolvedName.trim()) {
    errors.name = t('form.nameRequired');
  }
  if (!input.bikeType) {
    errors.type = t('form.typeRequired');
  }
  if (optionalNumberFromInput(input.distanceKmStr).invalid) {
    errors.distanceKm = t('form.distanceInvalid');
  }
  if (optionalNumberFromInput(input.usageHoursStr).invalid) {
    errors.usageHours = t('form.hoursInvalid');
  }

  return errors;
}
