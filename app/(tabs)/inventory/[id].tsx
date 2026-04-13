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
import { TransferItemDialog } from '@/features/inventory/components/TransferItemDialog/TransferItemDialog';
import { RemoveFromInventoryDialog } from '@/features/inventory/components/RemoveFromInventoryDialog/RemoveFromInventoryDialog';
import { useTransferItem } from '@/features/inventory/hooks/useTransferItem';
import { canTransferItem } from '@/features/inventory/utils/itemPermissions';
import { useAuth } from '@/features/auth';
import { useGroups } from '@/features/groups';
import { ConfirmDialog, LoadingScreen } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { ItemStatus } from '@/shared/types';
import type { ItemId, UserId } from '@/shared/types';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('exchange');
  const { t: tInv } = useTranslation('inventory');
  const { t: tBorrow } = useTranslation('borrow');
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();
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
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();
  const { user } = useAuth();
  const { data: userGroups } = useGroups();
  const transferItem = useTransferItem();

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const groupRole = item.groupId
    ? userGroups?.find((g) => g.id === item.groupId)?.memberRole
    : undefined;
  const showTransferToGroup =
    canTransferItem(item, user?.id ?? '', undefined) && item.groupId === undefined;
  const showTransferToMe =
    canTransferItem(item, user?.id ?? '', groupRole) && item.groupId !== undefined;

  const handleTransferToMe = () => {
    if (transferItem.isPending) return;
    const stableUserId = user?.id as UserId | undefined;
    if (!stableUserId) return;
    openConfirm({
      title: tInv('transfer.toPersonal'),
      message: tInv('transfer.toPersonalConfirm'),
      confirmLabel: tInv('transfer.confirm'),
      onConfirm: () => {
        if (transferItem.isPending) return;
        closeConfirm();
        transferItem.mutate(
          { itemId: item.id, toOwnerId: stableUserId },
          {
            onSuccess: () =>
              showSnackbarAlert({ message: tInv('transfer.success'), variant: 'success' }),
            onError: () =>
              showSnackbarAlert({
                message: tInv('transfer.error'),
                variant: 'error',
                duration: 'long',
              }),
          },
        );
      },
    });
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
            onSuccess: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('feedback.markedDonated'),
                variant: 'success',
              });
            },
            onError: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('errors.generic'),
                variant: 'error',
                duration: 'long',
              });
            },
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
            onSuccess: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('feedback.markedSold'),
                variant: 'success',
              });
            },
            onError: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('errors.generic'),
                variant: 'error',
                duration: 'long',
              });
            },
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
            onSuccess: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('feedback.statusUpdated'),
                variant: 'success',
              });
            },
            onError: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('errors.generic'),
                variant: 'error',
                duration: 'long',
              });
            },
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
            onSuccess: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('feedback.statusUpdated'),
                variant: 'success',
              });
            },
            onError: () => {
              closeConfirm();
              showSnackbarAlert({
                message: tCommon('errors.generic'),
                variant: 'error',
                duration: 'long',
              });
            },
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
          closeConfirm();
          showSnackbarAlert({
            message: tCommon('errors.generic'),
            variant: 'error',
            duration: 'long',
          });
        }
      },
    });
  };

  const canArchive = item.status !== ItemStatus.Archived;
  const itemDeletable = canDelete(item);
  const showRemoveFromBin = canArchive || itemDeletable;

  const handleMarkReturned = () => {
    const onDone = () => {
      closeConfirm();
      showSnackbarAlert({
        message: tCommon('feedback.returned'),
        variant: 'success',
      });
    };
    const onFail = () => {
      closeConfirm();
      showSnackbarAlert({
        message: tCommon('errors.generic'),
        variant: 'error',
        duration: 'long',
      });
    };

    openConfirm({
      title: tBorrow('confirm.markReturned.title'),
      message: tBorrow('confirm.markReturned.message'),
      cancelLabel: tBorrow('confirm.markReturned.cancel'),
      confirmLabel: tBorrow('confirm.markReturned.confirm'),
      onConfirm: () => {
        if (acceptedBorrowRequestId != null) {
          markReturned.mutate(
            { requestId: acceptedBorrowRequestId, itemId: item.id },
            {
              onSuccess: onDone,
              onError: onFail,
            },
          );
        } else {
          void updateStatus
            .mutateAsync({ id: item.id, status: ItemStatus.Stored })
            .then(onDone)
            .catch(onFail);
        }
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
        {showTransferToGroup && (
          <Appbar.Action
            icon="swap-horizontal"
            onPress={() => setTransferDialogOpen(true)}
            disabled={transferItem.isPending}
            accessibilityLabel={tInv('transfer.title')}
          />
        )}
        {showTransferToMe && (
          <Appbar.Action
            icon="swap-horizontal"
            onPress={handleTransferToMe}
            disabled={transferItem.isPending}
            accessibilityLabel={tInv('transfer.toPersonal')}
          />
        )}
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
      {showTransferToGroup && (
        <TransferItemDialog
          item={item}
          visible={transferDialogOpen}
          onDismiss={() => setTransferDialogOpen(false)}
        />
      )}
      <ConfirmDialog
        {...confirmDialogProps}
        loading={
          markDonated.isPending ||
          markSold.isPending ||
          updateStatus.isPending ||
          deleteItem.isPending ||
          markReturned.isPending
        }
      />
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
