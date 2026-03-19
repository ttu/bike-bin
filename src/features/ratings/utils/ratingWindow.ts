import type { Rating } from '@/shared/types';
import type { UserId } from '@/shared/types';

type RatingWindow = Pick<Rating, 'editableUntil'>;
type RatingWithAuthor = Pick<Rating, 'editableUntil' | 'fromUserId'>;

/** Rating editing window duration in days. */
export const RATING_WINDOW_DAYS = 14;

/**
 * Whether the rating is still within its editable time window.
 * Returns true only if `editableUntil` is defined and in the future.
 */
export function isWithinRatingWindow(rating: RatingWindow): boolean {
  if (!rating.editableUntil) return false;
  return new Date(rating.editableUntil) > new Date();
}

/**
 * Whether the current user can edit this rating.
 * True if the user is the author AND the rating is within its editable window.
 */
export function canEditRating(rating: RatingWithAuthor, userId: UserId): boolean {
  return rating.fromUserId === userId && isWithinRatingWindow(rating);
}

/**
 * Whether the current user can delete this rating.
 * True if the user is the author (anytime, regardless of window).
 */
export function canDeleteRating(rating: Pick<Rating, 'fromUserId'>, userId: UserId): boolean {
  return rating.fromUserId === userId;
}
