import type { Rating } from '@/shared/types';
import type { RatingId, UserId, ItemId, RatingRow } from '@/shared/types';
import type { TransactionType } from '@/shared/types';
import type { RatingWithReviewer } from '../types';

/** Transforms a Supabase row into the Rating domain model. */
export function mapRatingRow(row: RatingRow): Rating {
  return {
    id: row.id as RatingId,
    fromUserId: row.from_user_id as UserId,
    toUserId: row.to_user_id as UserId,
    itemId: (row.item_id as ItemId) ?? undefined,
    transactionType: row.transaction_type as TransactionType,
    score: row.score as number,
    text: (row.text as string) ?? undefined,
    editableUntil: (row.editable_until as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
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
