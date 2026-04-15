import type { GroupRow, GroupMemberRow } from '@/shared/types';
import { mapGroupRow, mapGroupMemberRow } from '../mapGroupRow';

describe('mapGroupRow', () => {
  it('maps all fields', () => {
    const row: GroupRow = {
      id: 'group-1',
      name: 'MTB Club',
      description: 'Mountain biking group',
      is_public: true,
      rating_avg: 4.5,
      rating_count: 12,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapGroupRow(row)).toEqual({
      id: 'group-1',
      name: 'MTB Club',
      description: 'Mountain biking group',
      isPublic: true,
      ratingAvg: 4.5,
      ratingCount: 12,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('handles optional description as undefined', () => {
    const row: GroupRow = {
      id: 'group-2',
      name: 'Road Riders',
      description: null,
      is_public: false,
      rating_avg: 0,
      rating_count: 0,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapGroupRow(row).description).toBeUndefined();
  });
});

describe('mapGroupMemberRow', () => {
  it('maps all fields', () => {
    const row: GroupMemberRow = {
      group_id: 'group-1',
      user_id: 'user-1',
      role: 'admin',
      joined_at: '2026-01-15T00:00:00Z',
    };
    expect(mapGroupMemberRow(row)).toEqual({
      groupId: 'group-1',
      userId: 'user-1',
      role: 'admin',
      joinedAt: '2026-01-15T00:00:00Z',
    });
  });
});
