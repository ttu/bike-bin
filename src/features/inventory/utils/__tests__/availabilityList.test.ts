import { AvailabilityType } from '@/shared/types';
import { availabilityTypesForList } from '../availabilityList';

describe('availabilityTypesForList', () => {
  it('removes private availability', () => {
    expect(
      availabilityTypesForList([
        AvailabilityType.Borrowable,
        AvailabilityType.Private,
        AvailabilityType.Sellable,
      ]),
    ).toEqual([AvailabilityType.Borrowable, AvailabilityType.Sellable]);
  });

  it('returns empty when only private', () => {
    expect(availabilityTypesForList([AvailabilityType.Private])).toEqual([]);
  });

  it('preserves order of non-private types', () => {
    expect(
      availabilityTypesForList([AvailabilityType.Sellable, AvailabilityType.Donatable]),
    ).toEqual([AvailabilityType.Sellable, AvailabilityType.Donatable]);
  });
});
