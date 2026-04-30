import { BorrowRequestStatus, ItemStatus } from '@/shared/types';
import { ACCEPTED_BORROW_REQUEST_FOR_ITEM_QUERY_KEY } from './useAcceptedBorrowRequestForItem';
import { useBorrowTransition } from './useBorrowTransition';

export function useMarkReturned() {
  return useBorrowTransition({
    newRequestStatus: BorrowRequestStatus.Returned,
    newItemStatus: ItemStatus.Stored,
    additionalInvalidateKeys: [ACCEPTED_BORROW_REQUEST_FOR_ITEM_QUERY_KEY],
  });
}
