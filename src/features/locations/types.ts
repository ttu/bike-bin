import type { LocationId } from '@/shared/types';

export interface UpdateLocationInput {
  id: LocationId;
  label?: string;
  postcode?: string;
  isPrimary?: boolean;
  country?: string;
}

export interface CreateLocationInput {
  postcode: string;
  label: string;
  isPrimary?: boolean;
  country?: string;
}
