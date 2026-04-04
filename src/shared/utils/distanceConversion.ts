import type { DistanceUnit } from '@/shared/types';

const KM_PER_MILE = 1.609344;

/** Convert km to miles (rounded to nearest integer). */
export function kmToMiles(km: number): number {
  return Math.round(km / KM_PER_MILE);
}

/** Convert miles to km (rounded to nearest integer). */
export function milesToKm(miles: number): number {
  return Math.round(miles * KM_PER_MILE);
}

/** Convert a km value to the user's preferred display unit. */
export function kmToDisplayUnit(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? kmToMiles(km) : km;
}

/** Convert a value in the user's display unit back to km. */
export function displayUnitToKm(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? milesToKm(value) : value;
}
