import { BorrowRequestStatus, ItemStatus } from '@/shared/types';
import { useBorrowTransition } from './useBorrowTransition';

export function useMarkPickedUp() {
  return useBorrowTransition({
    newRequestStatus: BorrowRequestStatus.PickedUp,
    newItemStatus: ItemStatus.Loaned,
  });
}
