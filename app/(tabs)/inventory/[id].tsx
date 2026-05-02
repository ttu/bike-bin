import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Snackbar, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import { useItem, useItemPhotos } from '@/features/inventory';
import { ItemDetail } from '@/features/inventory/components/ItemDetail/ItemDetail';
import { TransferItemDialog } from '@/features/inventory/components/TransferItemDialog/TransferItemDialog';
import { RemoveFromInventoryDialog } from '@/features/inventory/components/RemoveFromInventoryDialog/RemoveFromInventoryDialog';
import { useTransferItem } from '@/features/inventory/hooks/useTransferItem';
import { canEditItem, canTransferItem } from '@/features/inventory/utils/itemPermissions';
import { useAuth } from '@/features/auth';
import { useGroups } from '@/features/groups';
import { useItemActions } from '@/features/inventory/hooks/useItemActions';
import { ConfirmDialog, LoadingScreen } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import type { ItemId, UserId } from '@/shared/types';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { t: tInv } = useTranslation('inventory');
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
  let fromBikeId: string | undefined;
  if (typeof fromBikeRaw === 'string') {
    fromBikeId = fromBikeRaw;
  } else if (Array.isArray(fromBikeRaw)) {
    fromBikeId = fromBikeRaw[0];
  }

  const { data: item, isLoading } = useItem(id as ItemId);
  const { data: photos } = useItemPhotos(id as ItemId);

  const [removeInventoryOpen, setRemoveInventoryOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const {
    openConfirm,
    closeConfirm,
    confirmDialogProps: transferConfirmProps,
  } = useConfirmDialog();
  const { user } = useAuth();
  const { data: userGroups } = useGroups();
  const transferItem = useTransferItem();

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const groupRole = item.groupId
    ? userGroups?.find((g) => g.id === item.groupId)?.memberRole
    : undefined;
  const canEdit = canEditItem(item, user?.id ?? '', groupRole);
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
        {canEdit && (
          <Appbar.Action
            icon="pencil"
            accessibilityLabel={tInv('editItem')}
            onPress={() => router.push(`/(tabs)/inventory/edit/${item.id}`)}
          />
        )}
      </Appbar.Header>
      <ItemDetailWithActions
        item={item}
        photos={photos ?? []}
        removeInventoryOpen={removeInventoryOpen}
        onOpenRemoveInventory={() => setRemoveInventoryOpen(true)}
        onCloseRemoveInventory={() => setRemoveInventoryOpen(false)}
      />
      {showTransferToGroup && (
        <TransferItemDialog
          item={item}
          visible={transferDialogOpen}
          onDismiss={() => setTransferDialogOpen(false)}
          transferItem={transferItem}
        />
      )}
      <ConfirmDialog {...transferConfirmProps} loading={transferItem.isPending} />
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

/**
 * Inner component that renders after item is loaded, so useItemActions
 * can be called unconditionally (hooks cannot be called after early return).
 */
function ItemDetailWithActions({
  item,
  photos,
  removeInventoryOpen,
  onOpenRemoveInventory,
  onCloseRemoveInventory,
}: Readonly<{
  item: import('@/shared/types').Item;
  photos: import('@/shared/types').ItemPhoto[];
  removeInventoryOpen: boolean;
  onOpenRemoveInventory: () => void;
  onCloseRemoveInventory: () => void;
}>) {
  const {
    handleMarkDonated,
    handleMarkSold,
    handleMarkLoaned,
    handleArchive,
    handleUnarchive,
    handleDelete,
    handleMarkReturned,
    markReturnedLoading,
    canArchiveItem,
    canUnarchiveItem,
    itemDeletable,
    showRemoveFromBin,
    confirmDialogProps,
    confirmLoading,
  } = useItemActions(item);

  return (
    <>
      <ItemDetail
        item={item}
        photos={photos}
        onMarkDonated={handleMarkDonated}
        onMarkSold={handleMarkSold}
        onMarkLoaned={handleMarkLoaned}
        onMarkReturned={handleMarkReturned}
        markReturnedLoading={markReturnedLoading}
        onUnarchive={canUnarchiveItem ? handleUnarchive : undefined}
        onRemoveFromBin={showRemoveFromBin ? onOpenRemoveInventory : undefined}
      />
      <RemoveFromInventoryDialog
        visible={removeInventoryOpen}
        onDismiss={onCloseRemoveInventory}
        onArchive={
          canArchiveItem
            ? () => {
                onCloseRemoveInventory();
                handleArchive();
              }
            : undefined
        }
        onDelete={
          itemDeletable
            ? () => {
                onCloseRemoveInventory();
                handleDelete();
              }
            : undefined
        }
      />
      <ConfirmDialog {...confirmDialogProps} loading={confirmLoading} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
