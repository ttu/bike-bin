import type { Rating } from '@/shared/types';
import type { RatingId, UserId, ItemId } from '@/shared/types';
import type { TransactionType } from '@/shared/types';
import type { RatingWithReviewer } from '../types';

/** Transforms a Supabase row into the Rating domain model. */
export function mapRatingRow(row: Record<string, unknown>): Rating {
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

/** Transforms a Supabase row (with joined profiles) into RatingWithReviewer. */
export function mapRatingWithReviewerRow(row: Record<string, unknown>): RatingWithReviewer {
  const profile = row.profiles as { display_name?: string; avatar_url?: string } | undefined;
  return {
    ...mapRatingRow(row),
    reviewer: {
      displayName: profile?.display_name,
      avatarUrl: profile?.avatar_url,
    },
  };
}
