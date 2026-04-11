import type { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../types';
import { resolveBikeFormName } from './resolveBikeFormName';
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
  const resolvedName = resolveBikeFormName(fields.name, fields.brand, fields.model);
  const distanceParsed = optionalNumberFromInput(fields.distanceKmStr);
  const hoursParsed = optionalNumberFromInput(fields.usageHoursStr);

  return {
    name: resolvedName.trim(),
    brand: fields.brand.trim() || undefined,
    model: fields.model.trim() || undefined,
    type: fields.bikeType,
    year: fields.year.trim() ? Number.parseInt(fields.year.trim(), 10) : undefined,
    distanceKm: distanceParsed.invalid ? undefined : distanceParsed.value,
    usageHours: hoursParsed.invalid ? undefined : hoursParsed.value,
    condition: fields.bikeCondition,
    notes: fields.notes.trim() || undefined,
  };
}
