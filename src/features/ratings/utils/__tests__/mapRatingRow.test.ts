import { mapRatingRow, mapRatingWithReviewerRow } from '../mapRatingRow';

describe('mapRatingRow', () => {
  it('maps all fields', () => {
    const row = {
      id: 'rating-1',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
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
      itemId: 'item-1',
      transactionType: 'borrow',
      score: 4,
      text: 'Great condition!',
      editableUntil: '2026-02-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('handles optional fields', () => {
    const row = {
      id: 'rating-2',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      transaction_type: 'donate',
      score: 5,
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
      transaction_type: 'borrow',
      score: 4,
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

  it('handles missing profiles data', () => {
    const row = {
      id: 'rating-2',
      from_user_id: 'user-A',
      to_user_id: 'user-B',
      transaction_type: 'sell',
      score: 3,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapRatingWithReviewerRow(row);
    expect(result.reviewer).toBeDefined();
  });
});
