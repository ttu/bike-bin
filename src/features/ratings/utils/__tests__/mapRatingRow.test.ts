import type { RatingRow } from '@/shared/types';
import { mapRatingRow, mapRatingWithReviewerRow } from '../mapRatingRow';

describe('mapRatingRow', () => {
  it('maps all fields', () => {
    const row: RatingRow = {
      id: 'rating-1',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      to_group_id: null,
      item_id: 'item-1',
      transaction_type: 'borrow',
      score: 4,
      text: 'Great condition!',
      editable_until: '2026-02-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(mapRatingRow(row)).toEqual({
      id: 'rating-1',
      fromUserId: 'user-A',
      toUserId: 'user-B',
      toGroupId: undefined,
      itemId: 'item-1',
      transactionType: 'borrow',
      score: 4,
      text: 'Great condition!',
      editableUntil: '2026-02-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('maps GDPR-anonymized reviewer (null from_user_id)', () => {
    const row: RatingRow = {
      id: 'rating-anon',
      from_user_id: null,
      to_user_id: 'user-B',
      to_group_id: null,
      item_id: null,
      transaction_type: 'borrow',
      score: 5,
      text: null,
      editable_until: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapRatingRow(row);
    expect(result.fromUserId).toBeUndefined();
    expect(result.toUserId).toBe('user-B');
  });

  it('handles optional fields', () => {
    const row: RatingRow = {
      id: 'rating-2',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      to_group_id: null,
      item_id: null,
      transaction_type: 'donate',
      score: 5,
      text: null,
      editable_until: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapRatingRow(row);
    expect(result.itemId).toBeUndefined();
    expect(result.text).toBeUndefined();
    expect(result.editableUntil).toBeUndefined();
  });
});

describe('mapRatingWithReviewerRow', () => {
  it('includes reviewer info from joined profiles', () => {
    const row = {
      id: 'rating-1',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      to_group_id: null,
      item_id: null,
      transaction_type: 'borrow' as const,
      score: 4,
      text: null,
      editable_until: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      profiles: { display_name: 'Alice', avatar_url: 'https://example.com/a.jpg' },
    };
    const result = mapRatingWithReviewerRow(row);
    expect(result.reviewer).toEqual({
      displayName: 'Alice',
      avatarUrl: 'https://example.com/a.jpg',
    });
  });

  it('handles anonymized reviewer with no joined profile', () => {
    const row = {
      id: 'rating-2',
      from_user_id: null,
      to_user_id: 'user-B',
      to_group_id: null,
      item_id: null,
      transaction_type: 'sell' as const,
      score: 3,
      text: null,
      editable_until: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapRatingWithReviewerRow(row);
    expect(result.fromUserId).toBeUndefined();
    expect(result.reviewer.displayName).toBeUndefined();
  });

  it('handles missing profiles data', () => {
    const row = {
      id: 'rating-2',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      to_group_id: null,
      item_id: null,
      transaction_type: 'sell' as const,
      score: 3,
      text: null,
      editable_until: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapRatingWithReviewerRow(row);
    expect(result.reviewer).toBeDefined();
  });
});
