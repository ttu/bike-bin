import { kmToMiles, milesToKm, kmToDisplayUnit, displayUnitToKm } from '../distanceConversion';

describe('distanceConversion', () => {
  describe('kmToMiles', () => {
    it('converts 0 km to 0 miles', () => {
      expect(kmToMiles(0)).toBe(0);
    });

    it('converts 1609 m (1.609 km) to 1 mile', () => {
      expect(kmToMiles(1.609344)).toBe(1);
    });

    it('converts 100 km to 62 miles', () => {
      expect(kmToMiles(100)).toBe(62);
    });
  });

  describe('milesToKm', () => {
    it('converts 0 miles to 0 km', () => {
      expect(milesToKm(0)).toBe(0);
    });

    it('converts 1 mile to 2 km (rounded)', () => {
      expect(milesToKm(1)).toBe(2);
    });

    it('converts 62 miles to 100 km (rounded)', () => {
      expect(milesToKm(62)).toBe(100);
    });
  });

  describe('kmToDisplayUnit', () => {
    it('returns km unchanged when unit is km', () => {
      expect(kmToDisplayUnit(1000, 'km')).toBe(1000);
    });

    it('converts to miles when unit is mi', () => {
      expect(kmToDisplayUnit(100, 'mi')).toBe(62);
    });
  });

  describe('displayUnitToKm', () => {
    it('returns value unchanged when unit is km', () => {
      expect(displayUnitToKm(1000, 'km')).toBe(1000);
    });

    it('converts miles to km when unit is mi', () => {
      expect(displayUnitToKm(62, 'mi')).toBe(100);
    });
  });
});
