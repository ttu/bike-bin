import { BorrowRequestStatus, ItemStatus } from '@/shared/types';
import { useBorrowTransition } from './useBorrowTransition';

export function useDeclineBorrowRequest() {
  return useBorrowTransition({
    newRequestStatus: BorrowRequestStatus.Rejected,
    newItemStatus: ItemStatus.Stored,
  });
}
