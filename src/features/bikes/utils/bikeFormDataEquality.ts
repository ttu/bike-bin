import type { BikeFormData } from '../types';

/** Maps non-finite numbers (e.g. NaN) to undefined so dirty checks match "no value". */
function normalizeOptionalFiniteNumber(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return Number.isFinite(value) ? value : undefined;
}

export function areBikeFormDataEqual(a: BikeFormData, b: BikeFormData): boolean {
  if (a.name !== b.name) return false;
  if ((a.brand ?? '') !== (b.brand ?? '')) return false;
  if ((a.model ?? '') !== (b.model ?? '')) return false;
  if (a.type !== b.type) return false;
  if (normalizeOptionalFiniteNumber(a.year) !== normalizeOptionalFiniteNumber(b.year)) return false;
  if (normalizeOptionalFiniteNumber(a.distanceKm) !== normalizeOptionalFiniteNumber(b.distanceKm))
    return false;
  if (normalizeOptionalFiniteNumber(a.usageHours) !== normalizeOptionalFiniteNumber(b.usageHours))
    return false;
  if (a.condition !== b.condition) return false;
  if ((a.notes ?? '') !== (b.notes ?? '')) return false;
  return true;
}
