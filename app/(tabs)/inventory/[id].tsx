import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Snackbar, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import {
  useItem,
  useItemPhotos,
  useUpdateItemStatus,
  useDeleteItem,
  canDelete,
  canUnarchive,
} from '@/features/inventory';
import { useAcceptedBorrowRequestForItem, useMarkReturned } from '@/features/borrow';
import { useMarkDonated, useMarkSold } from '@/features/exchange';
import { ItemDetail } from '@/features/inventory/components/ItemDetail/ItemDetail';
import { RemoveFromInventoryDialog } from '@/features/inventory/components/RemoveFromInventoryDialog/RemoveFromInventoryDialog';
import { ConfirmDialog, LoadingScreen } from '@/shared/components';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('exchange');
  const { t: tInv } = useTranslation('inventory');
  const { t: tBorrow } = useTranslation('borrow');
  const { t: tCommon } = useTranslation('common');
  const params = useLocalSearchParams<{
    id: string;
    fromBike?: string | string[];
    photoLimitWarning?: string;
  }>();
  const { id } = params;
  const [photoLimitSnackbarVisible, setPhotoLimitSnackbarVisible] = useState(
    () => params.photoLimitWarning === '1',
  );
  const fromBikeRaw = params.fromBike;
  const fromBikeId =
    typeof fromBikeRaw === 'string'
      ? fromBikeRaw
      : Array.isArray(fromBikeRaw)
        ? fromBikeRaw[0]
        : undefined;

  const { data: item, isLoading } = useItem(id as ItemId);
  const { data: photos } = useItemPhotos(id as ItemId);
  const updateStatus = useUpdateItemStatus();
  const deleteItem = useDeleteItem();
  const markDonated = useMarkDonated();
  const markSold = useMarkSold();
  const markReturned = useMarkReturned();
  const { data: acceptedBorrowRequestId, isFetching: isFetchingAcceptedBorrowRequest } =
    useAcceptedBorrowRequestForItem(id as ItemId, {
      enabled: !isLoading && item !== undefined && item.status === ItemStatus.Loaned,
    });

  const [removeInventoryOpen, setRemoveInventoryOpen] = useState(false);
  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const handleMarkDonated = () => {
    openConfirm({
      title: t('confirm.donate.title'),
      message: t('confirm.donate.message'),
      cancelLabel: t('confirm.donate.cancel'),
      confirmLabel: t('confirm.donate.confirm'),
      onConfirm: () => {
        closeConfirm();
        markDonated.mutate({ itemId: item.id });
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
        closeConfirm();
        markSold.mutate({ itemId: item.id });
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
        closeConfirm();
        void updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Archived });
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
        closeConfirm();
        void updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Stored });
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
        closeConfirm();
        await deleteItem.mutateAsync({ id: item.id, status: item.status });
        tabScopedBack('/(tabs)/inventory');
      },
    });
  };

  const canArchive = item.status !== ItemStatus.Archived;
  const itemDeletable = canDelete(item);
  const showRemoveFromBin = canArchive || itemDeletable;

  const handleMarkReturned = () => {
    const run = () => {
      if (acceptedBorrowRequestId != null) {
        markReturned.mutate({ requestId: acceptedBorrowRequestId, itemId: item.id });
      } else {
        void updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Stored });
      }
    };

    openConfirm({
      title: tBorrow('confirm.markReturned.title'),
      message: tBorrow('confirm.markReturned.message'),
      cancelLabel: tBorrow('confirm.markReturned.cancel'),
      confirmLabel: tBorrow('confirm.markReturned.confirm'),
      onConfirm: () => {
        closeConfirm();
        run();
      },
    });
  };

  const handleHeaderBack = () => {
    if (fromBikeId) {
      router.replace(`/(tabs)/bikes/${fromBikeId}` as Href);
      return;
    }
    tabScopedBack('/(tabs)/inventory');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        dark={theme.dark}
        elevated={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Appbar.BackAction onPress={handleHeaderBack} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="pencil"
          onPress={() => router.push(`/(tabs)/inventory/edit/${item.id}`)}
        />
      </Appbar.Header>
      <ItemDetail
        item={item}
        photos={photos ?? []}
        onMarkDonated={handleMarkDonated}
        onMarkSold={handleMarkSold}
        onMarkReturned={handleMarkReturned}
        markReturnedLoading={item.status === ItemStatus.Loaned && isFetchingAcceptedBorrowRequest}
        onUnarchive={canUnarchive(item) ? handleUnarchive : undefined}
        onRemoveFromBin={showRemoveFromBin ? () => setRemoveInventoryOpen(true) : undefined}
      />
      <RemoveFromInventoryDialog
        visible={removeInventoryOpen}
        onDismiss={() => setRemoveInventoryOpen(false)}
        onArchive={
          canArchive
            ? () => {
                setRemoveInventoryOpen(false);
                handleArchive();
              }
            : undefined
        }
        onDelete={
          itemDeletable
            ? () => {
                setRemoveInventoryOpen(false);
                handleDelete();
              }
            : undefined
        }
      />
      <ConfirmDialog {...confirmDialogProps} />
      <Snackbar
        visible={photoLimitSnackbarVisible}
        onDismiss={() => setPhotoLimitSnackbarVisible(false)}
        duration={5000}
        action={{
          label: tCommon('actions.close'),
          onPress: () => setPhotoLimitSnackbarVisible(false),
        }}
      >
        {tInv('limit.saveSnackbarPhoto')}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
