import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useUpdateItemStatus, useDeleteItem, canDelete, canUnarchive } from '@/features/inventory';
import {
  useAcceptedBorrowRequestForItem,
  useMarkReturned,
  ACCEPTED_BORROW_REQUEST_FOR_ITEM_QUERY_KEY,
  BORROW_REQUESTS_QUERY_KEY,
} from '@/features/borrow';
import { useMarkDonated, useMarkSold } from '@/features/exchange';
import { ItemStatus, type Item } from '@/shared/types';

export function useItemActions(item: Item) {
  const { t } = useTranslation('exchange');
  const { t: tInv } = useTranslation('inventory');
  const { t: tBorrow } = useTranslation('borrow');
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();

  const queryClient = useQueryClient();
  const updateStatus = useUpdateItemStatus();
  const deleteItem = useDeleteItem();
  const markDonated = useMarkDonated();
  const markSold = useMarkSold();
  const markReturned = useMarkReturned();
  const { data: acceptedBorrowRequestId, isFetching: isFetchingAcceptedBorrowRequest } =
    useAcceptedBorrowRequestForItem(item.id, {
      enabled: item.status === ItemStatus.Loaned,
    });

  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  const onSuccess = (message: string) => {
    closeConfirm();
    showSnackbarAlert({ message, variant: 'success' });
  };

  const onError = () => {
    closeConfirm();
    showSnackbarAlert({ message: tCommon('errors.generic'), variant: 'error', duration: 'long' });
  };

  const handleMarkDonated = () => {
    openConfirm({
      title: t('confirm.donate.title'),
      message: t('confirm.donate.message'),
      cancelLabel: t('confirm.donate.cancel'),
      confirmLabel: t('confirm.donate.confirm'),
      onConfirm: () => {
        markDonated.mutate(
          { itemId: item.id },
          {
            onSuccess: () => onSuccess(tCommon('feedback.markedDonated')),
            onError,
          },
        );
      },
    });
  };

  const handleMarkSold = () => {
    openConfirm({
      title: t('confirm.sell.title'),
      message: t('confirm.sell.message'),
      cancelLabel: t('confirm.sell.cancel'),
      confirmLabel: t('confirm.sell.confirm'),
      onConfirm: () => {
        markSold.mutate(
          { itemId: item.id },
          {
            onSuccess: () => onSuccess(tCommon('feedback.markedSold')),
            onError,
          },
        );
      },
    });
  };

  const handleArchive = () => {
    openConfirm({
      title: tInv('confirm.archive.title'),
      message: tInv('confirm.archive.message'),
      cancelLabel: tInv('confirm.archive.cancel'),
      confirmLabel: tInv('confirm.archive.confirm'),
      onConfirm: () => {
        updateStatus.mutate(
          { id: item.id, status: ItemStatus.Archived },
          {
            onSuccess: () => onSuccess(tCommon('feedback.statusUpdated')),
            onError,
          },
        );
      },
    });
  };

  const handleUnarchive = () => {
    openConfirm({
      title: tInv('confirm.unarchive.title'),
      message: tInv('confirm.unarchive.message'),
      cancelLabel: tInv('confirm.unarchive.cancel'),
      confirmLabel: tInv('confirm.unarchive.confirm'),
      onConfirm: () => {
        updateStatus.mutate(
          { id: item.id, status: ItemStatus.Stored },
          {
            onSuccess: () => onSuccess(tCommon('feedback.statusUpdated')),
            onError,
          },
        );
      },
    });
  };

  const handleDelete = () => {
    openConfirm({
      title: tInv('confirm.delete.title'),
      message: tInv('confirm.delete.message'),
      cancelLabel: tInv('confirm.delete.cancel'),
      confirmLabel: tInv('confirm.delete.confirm'),
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteItem.mutateAsync({ id: item.id, status: item.status });
          closeConfirm();
          showSnackbarAlert({
            message: tCommon('feedback.itemDeleted'),
            variant: 'success',
          });
          tabScopedBack('/(tabs)/inventory');
        } catch {
          onError();
        }
      },
    });
  };

  const handleMarkReturned = () => {
    const onDone = () => onSuccess(tCommon('feedback.returned'));

    openConfirm({
      title: tBorrow('confirm.markReturned.title'),
      message: tBorrow('confirm.markReturned.message'),
      cancelLabel: tBorrow('confirm.markReturned.cancel'),
      confirmLabel: tBorrow('confirm.markReturned.confirm'),
      onConfirm: async () => {
        if (acceptedBorrowRequestId == null) {
          try {
            await updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Stored });
            // useUpdateItemStatus only invalidates ['items'] and ['items', id];
            // mirror the rest of the markReturned flow so borrow-related caches
            // (borrow requests inbox, group/search lists, accepted-request lookup)
            // don't go stale on this recovery path.
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: [BORROW_REQUESTS_QUERY_KEY] }),
              queryClient.invalidateQueries({ queryKey: ['group-items'] }),
              queryClient.invalidateQueries({ queryKey: ['search', 'items'] }),
              queryClient.invalidateQueries({
                queryKey: [ACCEPTED_BORROW_REQUEST_FOR_ITEM_QUERY_KEY, item.id],
              }),
            ]);
            onDone();
          } catch {
            onError();
          }
          return;
        }
        markReturned.mutate(
          { requestId: acceptedBorrowRequestId, itemId: item.id },
          { onSuccess: onDone, onError },
        );
      },
    });
  };

  const canArchiveItem = item.status !== ItemStatus.Archived;
  const itemDeletable = canDelete(item);
  const showRemoveFromBin = canArchiveItem || itemDeletable;

  return {
    handleMarkDonated,
    handleMarkSold,
    handleArchive,
    handleUnarchive,
    handleDelete,
    handleMarkReturned,
    markReturnedLoading: item.status === ItemStatus.Loaned && isFetchingAcceptedBorrowRequest,
    canArchiveItem,
    canUnarchiveItem: canUnarchive(item),
    itemDeletable,
    showRemoveFromBin,
    confirmDialogProps,
    confirmLoading:
      markDonated.isPending ||
      markSold.isPending ||
      updateStatus.isPending ||
      deleteItem.isPending ||
      markReturned.isPending,
  };
}
