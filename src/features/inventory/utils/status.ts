import type { Item } from '@/shared/types';
import { ItemStatus } from '@/shared/types';

const NON_DELETABLE_STATUSES: ReadonlySet<ItemStatus> = new Set([
  ItemStatus.Loaned,
  ItemStatus.Reserved,
]);

const TERMINAL_STATUSES: ReadonlySet<ItemStatus> = new Set([
  ItemStatus.Archived,
  ItemStatus.Sold,
  ItemStatus.Donated,
]);

export function isTerminalStatus(status: ItemStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function canDelete(item: Pick<Item, 'status'>): boolean {
  return !NON_DELETABLE_STATUSES.has(item.status);
}

export function canUnarchive(item: Pick<Item, 'status'>): boolean {
  return item.status === ItemStatus.Archived;
}

export function canEditAvailability(item: Pick<Item, 'status'>): boolean {
  return !NON_DELETABLE_STATUSES.has(item.status);
}

type StatusColorToken = 'outline' | 'warning' | 'success';

export function getStatusColor(status: ItemStatus): StatusColorToken {
  switch (status) {
    case ItemStatus.Loaned:
    case ItemStatus.Reserved:
      return 'warning';
    case ItemStatus.Donated:
    case ItemStatus.Sold:
      return 'success';
    case ItemStatus.Stored:
    case ItemStatus.Mounted:
    case ItemStatus.Archived:
    default:
      return 'outline';
  }
}
