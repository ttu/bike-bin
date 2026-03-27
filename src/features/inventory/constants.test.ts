import { ItemCategory } from '@/shared/types';
import { DEFAULT_BRANDS, SUBCATEGORIES } from './constants';

describe('inventory constants', () => {
  it('includes cameras as an accessory type', () => {
    expect(SUBCATEGORIES[ItemCategory.Accessory]).toContain('cameras');
  });

  it('includes common camera manufacturers in default brands', () => {
    expect(DEFAULT_BRANDS).toEqual(expect.arrayContaining(['GoPro', 'Insta360', 'DJI']));
  });
});
