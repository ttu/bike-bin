import { AvailabilityType } from '@/shared/types';

/** Availability chips on inventory list rows; Private is omitted (implicit default). */
export function availabilityTypesForList(types: AvailabilityType[]): AvailabilityType[] {
  return types.filter((t) => t !== AvailabilityType.Private);
}
