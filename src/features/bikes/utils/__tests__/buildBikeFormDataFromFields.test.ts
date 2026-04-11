import { BikeType, ItemCondition } from '@/shared/types';
import { buildBikeFormDataFromFields } from '../buildBikeFormDataFromFields';

describe('buildBikeFormDataFromFields', () => {
  it('maps invalid year text to undefined instead of NaN', () => {
    const data = buildBikeFormDataFromFields({
      name: 'x',
      brand: '',
      model: '',
      bikeType: BikeType.Road,
      year: 'abc',
      distanceKmStr: '',
      usageHoursStr: '',
      bikeCondition: ItemCondition.New,
      notes: '',
    });
    expect(data.year).toBeUndefined();
    expect(Number.isNaN(data.year as number)).toBe(false);
  });

  it('parses valid year string', () => {
    const data = buildBikeFormDataFromFields({
      name: 'x',
      brand: '',
      model: '',
      bikeType: BikeType.Road,
      year: '2019',
      distanceKmStr: '',
      usageHoursStr: '',
      bikeCondition: ItemCondition.New,
      notes: '',
    });
    expect(data.year).toBe(2019);
  });
});
