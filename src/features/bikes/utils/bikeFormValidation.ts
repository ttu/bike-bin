import type { TFunction } from 'i18next';
import type { BikeFormData } from '../types';

export interface BikeFormErrors {
  name?: string;
  type?: string;
  distanceKm?: string;
  usageHours?: string;
}

export interface BikeFormValidationInput {
  /** Parsed draft data — `name` is already resolved and trimmed; numeric fields are `undefined` for both empty and invalid input. */
  data: BikeFormData;
  /** Raw distance input, used only to distinguish empty (no error) from invalid (error). */
  distanceKmStr: string;
  /** Raw usage-hours input, used only to distinguish empty from invalid. */
  usageHoursStr: string;
}

/**
 * Validate a parsed `BikeFormData` draft. Pure function so it can be
 * unit-tested without rendering the component. Raw strings are only consulted
 * to disambiguate "empty input" from "invalid input" for numeric fields, since
 * both collapse to `undefined` after parsing.
 */
export function validateBikeForm(
  input: BikeFormValidationInput,
  t: TFunction<'bikes'>,
): BikeFormErrors {
  const errors: BikeFormErrors = {};

  if (!input.data.name) {
    errors.name = t('form.nameRequired');
  }
  if (!input.data.type) {
    errors.type = t('form.typeRequired');
  }
  if (input.data.distanceKm === undefined && input.distanceKmStr.trim() !== '') {
    errors.distanceKm = t('form.distanceInvalid');
  }
  if (input.data.usageHours === undefined && input.usageHoursStr.trim() !== '') {
    errors.usageHours = t('form.hoursInvalid');
  }

  return errors;
}
