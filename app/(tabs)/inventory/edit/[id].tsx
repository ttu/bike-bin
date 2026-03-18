import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useItem, useUpdateItem, useDeleteItem } from '@/features/inventory';
import type { ItemFormData } from '@/features/inventory';
import { ItemForm } from '@/features/inventory/components/ItemForm/ItemForm';
import { canDelete } from '@/features/inventory';
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen';
import type { ItemId } from '@/shared/types';

export default function EditItemScreen() {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: item, isLoading } = useItem(id as ItemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const handleSave = async (data: ItemFormData) => {
    await updateItem.mutateAsync({ ...data, id: id as ItemId });
    router.back();
  };

  const handleDelete = async () => {
    if (item && canDelete(item)) {
      await deleteItem.mutateAsync({ id: item.id, status: item.status });
      router.back();
    }
  };

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const initialData: ItemFormData = {
    name: item.name,
    category: item.category,
    condition: item.condition,
    brand: item.brand,
    model: item.model,
    description: item.description,
    availabilityTypes: item.availabilityTypes,
    price: item.price,
    deposit: item.deposit,
    borrowDuration: item.borrowDuration,
    storageLocation: item.storageLocation,
    age: item.age,
    usageKm: item.usageKm,
    purchaseDate: item.purchaseDate,
    pickupLocationId: item.pickupLocationId,
    visibility: item.visibility,
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
        <Appbar.Content title={t('editItem')} />
      </Appbar.Header>
      <ItemForm
        initialData={initialData}
        onSave={handleSave}
        onDelete={canDelete(item) ? handleDelete : undefined}
        isSubmitting={updateItem.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
