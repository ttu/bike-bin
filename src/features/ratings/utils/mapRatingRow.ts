import type {
  GroupId,
  ItemId,
  Rating,
  RatingId,
  RatingRecipient,
  RatingRow,
  UserId,
} from '@/shared/types';
import type { RatingWithReviewer } from '../types';

/** Transforms a Supabase row into the Rating domain model. */
export function mapRatingRow(row: RatingRow): Rating {
  const recipient: RatingRecipient =
    row.to_group_id == null
      ? { toUserId: (row.to_user_id as UserId | null) ?? undefined }
      : { toGroupId: row.to_group_id as GroupId };

  return {
    ...recipient,
    id: row.id as RatingId,
    fromUserId: (row.from_user_id as UserId | null) ?? undefined,
    itemId: (row.item_id as ItemId | null) ?? undefined,
    transactionType: row.transaction_type,
    score: row.score,
    text: row.text ?? undefined,
    editableUntil: row.editable_until ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type RatingRowWithProfile = RatingRow & {
  profiles?: { display_name?: string; avatar_url?: string } | null;
};

/** Transforms a Supabase row (with joined profiles) into RatingWithReviewer. */
export function mapRatingWithReviewerRow(row: RatingRowWithProfile): RatingWithReviewer {
  return {
    ...mapRatingRow(row),
    reviewer: {
      displayName: row.profiles?.display_name,
      avatarUrl: row.profiles?.avatar_url,
    },
  };
}
