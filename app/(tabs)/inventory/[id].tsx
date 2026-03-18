import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useItem, useItemPhotos, useUpdateItemStatus, useDeleteItem } from '@/features/inventory';
import { ItemDetail } from '@/features/inventory/components/ItemDetail/ItemDetail';
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: item, isLoading } = useItem(id as ItemId);
  const { data: photos } = useItemPhotos(id as ItemId);
  const updateStatus = useUpdateItemStatus();
  const deleteItem = useDeleteItem();

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

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
        onMarkDonated={() => updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Donated })}
        onMarkSold={() => updateStatus.mutateAsync({ id: item.id, status: ItemStatus.Sold })}
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
