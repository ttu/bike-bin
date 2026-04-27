import type { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../types';
import { resolveFormName } from '@/shared/utils';
import { optionalNumberFromInput } from './optionalNumberFromInput';

export interface BikeFormDraftFields {
  name: string;
  brand: string;
  model: string;
  bikeType: BikeType | undefined;
  year: string;
  distanceKmStr: string;
  usageHoursStr: string;
  bikeCondition: ItemCondition;
  notes: string;
}

export function buildBikeFormDataFromFields(fields: BikeFormDraftFields): BikeFormData {
  const resolvedName = resolveFormName(fields.name, fields.brand, fields.model);
  const distanceParsed = optionalNumberFromInput(fields.distanceKmStr);
  const hoursParsed = optionalNumberFromInput(fields.usageHoursStr);
  const yearParsed = optionalNumberFromInput(fields.year);
  const yearFromInput =
    yearParsed.invalid || yearParsed.value === undefined ? undefined : Math.round(yearParsed.value);
  const yearNormalized = Number.isNaN(yearFromInput) ? undefined : yearFromInput;

  return {
    name: resolvedName.trim(),
    brand: fields.brand.trim() || undefined,
    model: fields.model.trim() || undefined,
    type: fields.bikeType,
    year: yearNormalized,
    distanceKm: distanceParsed.invalid ? undefined : distanceParsed.value,
    usageHours: hoursParsed.invalid ? undefined : hoursParsed.value,
    condition: fields.bikeCondition,
    notes: fields.notes.trim() || undefined,
  };
}
