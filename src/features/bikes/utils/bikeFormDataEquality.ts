import type { BikeFormData } from '../types';

export function areBikeFormDataEqual(a: BikeFormData, b: BikeFormData): boolean {
  if (a.name !== b.name) return false;
  if ((a.brand ?? '') !== (b.brand ?? '')) return false;
  if ((a.model ?? '') !== (b.model ?? '')) return false;
  if (a.type !== b.type) return false;
  if (a.year !== b.year) return false;
  if (a.distanceKm !== b.distanceKm) return false;
  if (a.usageHours !== b.usageHours) return false;
  if (a.condition !== b.condition) return false;
  if ((a.notes ?? '') !== (b.notes ?? '')) return false;
  return true;
}
