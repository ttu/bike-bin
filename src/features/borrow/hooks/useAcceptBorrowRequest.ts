import { useBorrowTransition } from './useBorrowTransition';

export function useAcceptBorrowRequest() {
  return useBorrowTransition({
    newRequestStatus: 'accepted',
    newItemStatus: 'loaned',
  });
}
