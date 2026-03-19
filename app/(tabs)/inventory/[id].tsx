import { Alert, View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useItem, useItemPhotos, useUpdateItemStatus, useDeleteItem } from '@/features/inventory';
import { useMarkDonated, useMarkSold } from '@/features/exchange';
import { ItemDetail } from '@/features/inventory/components/ItemDetail/ItemDetail';
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('exchange');
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: item, isLoading } = useItem(id as ItemId);
  const { data: photos } = useItemPhotos(id as ItemId);
  const updateStatus = useUpdateItemStatus();
  const deleteItem = useDeleteItem();
  const markDonated = useMarkDonated();
  const markSold = useMarkSold();

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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <Appbar.Header elevated={false} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
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
        onMarkReturned={() => updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Stored })}
        onArchive={() => updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Archived })}
        onDelete={async () => {
          await deleteItem.mutateAsync({ id: item.id, status: item.status });
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
