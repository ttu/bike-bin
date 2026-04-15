import type { Rating, TransactionType, UserProfile } from '@/shared/types';
import type { RatingId, UserId, GroupId, ItemId, BorrowRequestId } from '@/shared/types';

interface CreateRatingBase {
  borrowRequestId: BorrowRequestId;
  itemId?: ItemId;
  transactionType: TransactionType;
  score: number;
  text?: string;
}

interface CreateUserRatingInput extends CreateRatingBase {
  toUserId: UserId;
  toGroupId?: never;
}

interface CreateGroupRatingInput extends CreateRatingBase {
  toGroupId: GroupId;
  toUserId?: never;
}

export type CreateRatingInput = CreateUserRatingInput | CreateGroupRatingInput;

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
