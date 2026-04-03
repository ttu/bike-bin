import { ItemCondition } from '@/shared/types';
import type { BikeRow } from '@/shared/types';
import { mapBikeRow } from '../mapBikeRow';

describe('mapBikeRow', () => {
  const fullRow: BikeRow = {
    id: 'bike-1',
    owner_id: 'user-1',
    name: 'My Gravel Bike',
    brand: 'Canyon',
    model: 'Grail',
    type: 'gravel',
    year: 2024,
    distance_km: 1250.5,
    usage_hours: 80,
    condition: 'worn',
    notes: '  Replaced chain at 1k km  ',
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
      distanceKm: 1250.5,
      usageHours: 80,
      condition: ItemCondition.Worn,
      notes: 'Replaced chain at 1k km',
      thumbnailStoragePath: undefined,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });
  });

  it('handles optional fields as undefined', () => {
    const minimalRow: BikeRow = {
      id: 'bike-2',
      owner_id: 'user-1',
      name: 'Unnamed',
      type: 'road',
      condition: 'good',
      brand: null,
      model: null,
      year: null,
      distance_km: null,
      usage_hours: null,
      notes: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapBikeRow(minimalRow);
    expect(result.brand).toBeUndefined();
    expect(result.model).toBeUndefined();
    expect(result.year).toBeUndefined();
    expect(result.distanceKm).toBeUndefined();
    expect(result.usageHours).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.condition).toBe(ItemCondition.Good);
  });

  it('parses numeric strings from PostgREST', () => {
    const row = {
      id: 'bike-3',
      owner_id: 'user-1',
      name: 'X',
      type: 'mtb' as const,
      distance_km: '99.25',
      usage_hours: '10',
      condition: 'good' as const,
      brand: null,
      model: null,
      year: null,
      notes: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    // PostgREST can return numeric strings; the mapper handles this via parseFloat
    const result = mapBikeRow(row as unknown as BikeRow);
    expect(result.distanceKm).toBe(99.25);
    expect(result.usageHours).toBe(10);
    expect(result.condition).toBe(ItemCondition.Good);
  });
});
