import type { Rating, TransactionType, UserProfile } from '@/shared/types';
import type { RatingId, UserId, ItemId } from '@/shared/types';

export interface CreateRatingInput {
  toUserId: UserId;
  itemId?: ItemId;
  transactionType: TransactionType;
  score: number;
  text?: string;
}

export interface UpdateRatingInput {
  id: RatingId;
  toUserId: UserId;
  score: number;
  text?: string;
}

export interface DeleteRatingInput {
  id: RatingId;
  toUserId: UserId;
}

export type RatingWithReviewer = Rating & {
  reviewer: Pick<UserProfile, 'displayName' | 'avatarUrl'>;
};
