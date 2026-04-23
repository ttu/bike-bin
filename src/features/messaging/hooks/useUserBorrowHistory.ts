import { useQuery } from '@tanstack/react-query';
import type { UserId } from '@/shared/types';

export const USER_BORROW_HISTORY_QUERY_KEY = 'user_borrow_history';

export interface UserBorrowHistory {
  borrowCount: number;
  completedOnTimeCount: number;
}

/**
 * Trust-signal stub for the chat header. Real borrow analytics aren't
 * wired up yet; the chat header treats `borrowCount === 0` as "hide".
 * TODO(design): wire to borrow history when analytics tables are available.
 */
export function useUserBorrowHistory(userId: UserId | undefined) {
  return useQuery({
    queryKey: [USER_BORROW_HISTORY_QUERY_KEY, userId],
    queryFn: async (): Promise<UserBorrowHistory> => {
      return { borrowCount: 0, completedOnTimeCount: 0 };
    },
    enabled: !!userId,
  });
}
