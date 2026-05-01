import type {
  BorrowRequestId,
  GroupId,
  ItemId,
  Rating,
  RatingId,
  TransactionType,
  UserId,
  UserProfile,
} from '@/shared/types';

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

interface RatingTargetUser {
  toUserId: UserId;
  toGroupId?: never;
}

interface RatingTargetGroup {
  toGroupId: GroupId;
  toUserId?: never;
}

type RatingTarget = RatingTargetUser | RatingTargetGroup;

export type UpdateRatingInput = RatingTarget & {
  id: RatingId;
  score: number;
  text?: string;
};

export type DeleteRatingInput = RatingTarget & {
  id: RatingId;
};

export type RatingWithReviewer = Rating & {
  reviewer: Pick<UserProfile, 'displayName' | 'avatarUrl'>;
};
