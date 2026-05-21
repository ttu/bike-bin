import { BorrowRequestStatus, ItemStatus } from '@/shared/types';
import { useBorrowTransition } from './useBorrowTransition';

export function useAcceptBorrowRequest() {
  return useBorrowTransition({
    newRequestStatus: BorrowRequestStatus.Accepted,
    newItemStatus: ItemStatus.Loaned,
  });
}
