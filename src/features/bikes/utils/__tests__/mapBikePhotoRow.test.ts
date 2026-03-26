import type { BikeId, BikePhotoId } from '@/shared/types';
import { mapBikePhotoRow } from '../mapBikePhotoRow';

describe('mapBikePhotoRow', () => {
  it('maps all fields from a raw row to a BikePhoto', () => {
    const row = {
      id: 'photo-1',
      bike_id: 'bike-1',
      storage_path: 'bikes/bike-1/photo-1.jpg',
      sort_order: 0,
      created_at: '2026-01-01T00:00:00Z',
    };

    const result = mapBikePhotoRow(row);

    expect(result).toEqual({
      id: 'photo-1' as BikePhotoId,
      bikeId: 'bike-1' as BikeId,
      storagePath: 'bikes/bike-1/photo-1.jpg',
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('preserves non-zero sort_order values', () => {
    const row = {
      id: 'photo-2',
      bike_id: 'bike-2',
      storage_path: 'bikes/bike-2/photo-2.jpg',
      sort_order: 3,
      created_at: '2026-02-15T12:00:00Z',
    };

    const result = mapBikePhotoRow(row);

    expect(result.sortOrder).toBe(3);
  });

  it('maps snake_case keys to camelCase domain fields', () => {
    const row = {
      id: 'photo-abc',
      bike_id: 'bike-xyz',
      storage_path: 'path/to/image.jpg',
      sort_order: 1,
      created_at: '2026-03-01T08:00:00Z',
    };

    const result = mapBikePhotoRow(row);

    expect(result.id).toBe('photo-abc');
    expect(result.bikeId).toBe('bike-xyz');
    expect(result.storagePath).toBe('path/to/image.jpg');
    expect(result.sortOrder).toBe(1);
    expect(result.createdAt).toBe('2026-03-01T08:00:00Z');
  });
});
