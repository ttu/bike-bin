import { SUBCATEGORIES } from '@/features/inventory/constants';
import { DEMO_ITEMS } from '../fixtures';

describe('DEMO_ITEMS category data', () => {
  it('uses subcategories that exist for each item category', () => {
    for (const item of DEMO_ITEMS) {
      const allowed = SUBCATEGORIES[item.category];
      if (item.subcategory !== undefined) {
        expect(allowed).toContain(item.subcategory);
      }
    }
  });
});
