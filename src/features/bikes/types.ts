import type { BikeType } from '@/shared/types';

export interface BikeFormData {
  name: string;
  brand?: string;
  model?: string;
  type?: BikeType;
  year?: number;
}
