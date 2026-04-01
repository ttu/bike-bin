import type { BikeType, ItemCondition } from '@/shared/types';

export interface BikeFormData {
  name: string;
  brand?: string;
  model?: string;
  type?: BikeType;
  year?: number;
  distanceKm?: number;
  usageHours?: number;
  condition: ItemCondition;
  notes?: string;
}
