import { mapBikeRow } from '../mapBikeRow';

describe('mapBikeRow', () => {
  const fullRow = {
    id: 'bike-1',
    owner_id: 'user-1',
    name: 'My Gravel Bike',
    brand: 'Canyon',
    model: 'Grail',
    type: 'gravel',
    year: 2024,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  };

  it('maps all fields from snake_case to camelCase', () => {
    expect(mapBikeRow(fullRow)).toEqual({
      id: 'bike-1',
      ownerId: 'user-1',
      name: 'My Gravel Bike',
      brand: 'Canyon',
      model: 'Grail',
      type: 'gravel',
      year: 2024,
      thumbnailStoragePath: undefined,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });
  });

  it('handles optional fields as undefined', () => {
    const minimalRow = {
      id: 'bike-2',
      owner_id: 'user-1',
      name: 'Unnamed',
      type: 'road',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapBikeRow(minimalRow);
    expect(result.brand).toBeUndefined();
    expect(result.model).toBeUndefined();
    expect(result.year).toBeUndefined();
  });
});
