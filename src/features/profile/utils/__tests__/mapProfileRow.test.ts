import { mapProfileRow } from '../mapProfileRow';

describe('mapProfileRow', () => {
  it('maps all fields', () => {
    const row = {
      id: 'user-1',
      display_name: 'BikeGuy',
      avatar_url: 'https://example.com/avatar.jpg',
      rating_avg: 4.5,
      rating_count: 12,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };
    expect(mapProfileRow(row)).toEqual({
      id: 'user-1',
      displayName: 'BikeGuy',
      avatarUrl: 'https://example.com/avatar.jpg',
      ratingAvg: 4.5,
      ratingCount: 12,
      distanceUnit: 'km',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });
  });

  it('handles optional displayName and avatarUrl', () => {
    const row = {
      id: 'user-2',
      rating_avg: 0,
      rating_count: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapProfileRow(row);
    expect(result.displayName).toBeUndefined();
    expect(result.avatarUrl).toBeUndefined();
  });
});
