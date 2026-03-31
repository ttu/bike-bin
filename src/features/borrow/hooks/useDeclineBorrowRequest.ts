import { useBorrowTransition } from './useBorrowTransition';

export function useDeclineBorrowRequest() {
  return useBorrowTransition({
    newRequestStatus: 'rejected',
    newItemStatus: 'stored',
  });
}
