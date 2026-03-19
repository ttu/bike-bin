import { createMockRating } from '@/test/factories';
import type { UserId } from '@/shared/types';
import { isWithinRatingWindow, canEditRating, canDeleteRating } from '../ratingWindow';

const currentUserId = 'user-current' as UserId;
const otherUserId = 'user-other' as UserId;

describe('isWithinRatingWindow', () => {
  it('returns true when editable_until is in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // +1 day
    const rating = createMockRating({ editableUntil: future });
    expect(isWithinRatingWindow(rating)).toBe(true);
  });

  it('returns false when editable_until is in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // -1 day
    const rating = createMockRating({ editableUntil: past });
    expect(isWithinRatingWindow(rating)).toBe(false);
  });

  it('returns false when editable_until is undefined', () => {
    const rating = createMockRating({ editableUntil: undefined });
    expect(isWithinRatingWindow(rating)).toBe(false);
  });

  it('returns false when editable_until is exactly now (boundary)', () => {
    const now = new Date().toISOString();
    const rating = createMockRating({ editableUntil: now });
    // At the exact boundary, the window has expired
    expect(isWithinRatingWindow(rating)).toBe(false);
  });
});

describe('canEditRating', () => {
  it('returns true when user is author and within window', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const rating = createMockRating({
      fromUserId: currentUserId,
      editableUntil: future,
    });
    expect(canEditRating(rating, currentUserId)).toBe(true);
  });

  it('returns false when user is author but window expired', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const rating = createMockRating({
      fromUserId: currentUserId,
      editableUntil: past,
    });
    expect(canEditRating(rating, currentUserId)).toBe(false);
  });

  it('returns false when within window but user is not the author', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const rating = createMockRating({
      fromUserId: otherUserId,
      editableUntil: future,
    });
    expect(canEditRating(rating, currentUserId)).toBe(false);
  });

  it('returns false when editable_until is undefined', () => {
    const rating = createMockRating({
      fromUserId: currentUserId,
      editableUntil: undefined,
    });
    expect(canEditRating(rating, currentUserId)).toBe(false);
  });
});

describe('canDeleteRating', () => {
  it('returns true when user is the author', () => {
    const rating = createMockRating({ fromUserId: currentUserId });
    expect(canDeleteRating(rating, currentUserId)).toBe(true);
  });

  it('returns false when user is not the author', () => {
    const rating = createMockRating({ fromUserId: otherUserId });
    expect(canDeleteRating(rating, currentUserId)).toBe(false);
  });

  it('returns true even when window has expired (author can always delete)', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days ago
    const rating = createMockRating({
      fromUserId: currentUserId,
      editableUntil: past,
    });
    expect(canDeleteRating(rating, currentUserId)).toBe(true);
  });
});
