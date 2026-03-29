import { Alert, Platform, View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import { useItem, useItemPhotos, useUpdateItemStatus, useDeleteItem } from '@/features/inventory';
import { useAcceptedBorrowRequestForItem, useMarkReturned } from '@/features/borrow';
import { useMarkDonated, useMarkSold } from '@/features/exchange';
import { ItemDetail } from '@/features/inventory/components/ItemDetail/ItemDetail';
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('exchange');
  const { t: tInv } = useTranslation('inventory');
  const { t: tBorrow } = useTranslation('borrow');
  const { id } = useLocalSearchParams<{ id: string }>();

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

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const handleMarkDonated = () => {
    Alert.alert(t('confirm.donate.title'), t('confirm.donate.message'), [
      { text: t('confirm.donate.cancel'), style: 'cancel' },
      {
        text: t('confirm.donate.confirm'),
        onPress: () => {
          markDonated.mutate({ itemId: item.id });
        },
      },
    ]);
  };

  const handleMarkSold = () => {
    Alert.alert(t('confirm.sell.title'), t('confirm.sell.message'), [
      { text: t('confirm.sell.cancel'), style: 'cancel' },
      {
        text: t('confirm.sell.confirm'),
        onPress: () => {
          markSold.mutate({ itemId: item.id });
        },
      },
    ]);
  };

  const handleArchive = () => {
    const doArchive = () => updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Archived });

    if (Platform.OS === 'web') {
      if (window.confirm(`${tInv('confirm.archive.title')}\n${tInv('confirm.archive.message')}`)) {
        doArchive();
      }
    } else {
      Alert.alert(tInv('confirm.archive.title'), tInv('confirm.archive.message'), [
        { text: tInv('confirm.archive.cancel'), style: 'cancel' },
        { text: tInv('confirm.archive.confirm'), onPress: doArchive },
      ]);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      await deleteItem.mutateAsync({ id: item.id, status: item.status });
      tabScopedBack('/(tabs)/inventory');
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${tInv('confirm.delete.title')}\n${tInv('confirm.delete.message')}`)) {
        doDelete();
      }
    } else {
      Alert.alert(tInv('confirm.delete.title'), tInv('confirm.delete.message'), [
        { text: tInv('confirm.delete.cancel'), style: 'cancel' },
        { text: tInv('confirm.delete.confirm'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleMarkReturned = () => {
    const run = () => {
      if (acceptedBorrowRequestId != null) {
        markReturned.mutate({ requestId: acceptedBorrowRequestId, itemId: item.id });
      } else {
        void updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Stored });
      }
    };

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          `${tBorrow('confirm.markReturned.title')}\n${tBorrow('confirm.markReturned.message')}`,
        )
      ) {
        run();
      }
    } else {
      Alert.alert(tBorrow('confirm.markReturned.title'), tBorrow('confirm.markReturned.message'), [
        { text: tBorrow('confirm.markReturned.cancel'), style: 'cancel' },
        { text: tBorrow('confirm.markReturned.confirm'), onPress: run },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated={false} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/inventory')} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="pencil"
          onPress={() => router.push(`/(tabs)/inventory/edit/${item.id}` as never)}
        />
      </Appbar.Header>
      <ItemDetail
        item={item}
        photos={photos ?? []}
        onMarkDonated={handleMarkDonated}
        onMarkSold={handleMarkSold}
        onMarkReturned={handleMarkReturned}
        markReturnedLoading={item.status === ItemStatus.Loaned && isFetchingAcceptedBorrowRequest}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
