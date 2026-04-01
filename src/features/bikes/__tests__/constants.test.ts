import { DEFAULT_BIKE_BRANDS } from '../constants';

describe('DEFAULT_BIKE_BRANDS', () => {
  it('includes major bicycle manufacturers', () => {
    expect(DEFAULT_BIKE_BRANDS).toEqual(
      expect.arrayContaining(['Trek', 'Specialized', 'Canyon', 'Giant']),
    );
  });

  it('excludes typical parts-only brands used in inventory suggestions', () => {
    expect(DEFAULT_BIKE_BRANDS).not.toContain('Shimano');
    expect(DEFAULT_BIKE_BRANDS).not.toContain('Park Tool');
    expect(DEFAULT_BIKE_BRANDS).not.toContain('Continental');
  });
});
