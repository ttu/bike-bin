import { createMockItem } from '@/test/factories';
import { sortItems } from '../sortItems';

const itemA = createMockItem({
  name: 'Chain',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
});
const itemB = createMockItem({
  name: 'Brake Pads',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
});
const itemC = createMockItem({
  name: 'Derailleur',
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
});

describe('sortItems', () => {
  it('sorts by recentlyAdded (createdAt descending)', () => {
    const result = sortItems([itemA, itemB, itemC], 'recentlyAdded');
    expect(result.map((i) => i.name)).toEqual(['Brake Pads', 'Derailleur', 'Chain']);
  });

  it('sorts by recentlyUpdated (updatedAt descending)', () => {
    const result = sortItems([itemA, itemB, itemC], 'recentlyUpdated');
    expect(result.map((i) => i.name)).toEqual(['Chain', 'Derailleur', 'Brake Pads']);
  });

  it('sorts by name alphabetically', () => {
    const result = sortItems([itemA, itemB, itemC], 'name');
    expect(result.map((i) => i.name)).toEqual(['Brake Pads', 'Chain', 'Derailleur']);
  });

  it('does not mutate the original array', () => {
    const original = [itemA, itemB, itemC];
    const frozen = [...original];
    sortItems(original, 'name');
    expect(original).toEqual(frozen);
  });

  it('returns empty array for empty input', () => {
    expect(sortItems([], 'recentlyAdded')).toEqual([]);
  });
});
