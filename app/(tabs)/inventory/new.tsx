import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useLocalInventory } from '@/features/auth/hooks/useLocalInventory';
import { useCreateItem } from '@/features/inventory';
import type { ItemFormData } from '@/features/inventory';
import { ItemForm } from '@/features/inventory/components/ItemForm/ItemForm';
import { ItemStatus, Visibility } from '@/shared/types';
import type { ItemId, UserId } from '@/shared/types';

export default function NewItemScreen() {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const createItem = useCreateItem();
  const { addItem } = useLocalInventory();

  const handleSave = async (data: ItemFormData) => {
    if (isAuthenticated) {
      await createItem.mutateAsync(data);
    } else {
      await addItem({
        id: Date.now().toString() as ItemId,
        ownerId: 'local' as UserId,
        bikeId: undefined,
        name: data.name,
        category: data.category!,
        subcategory: data.subcategory,
        condition: data.condition!,
        status: ItemStatus.Stored,
        availabilityTypes: data.availabilityTypes,
        brand: data.brand,
        model: data.model,
        description: data.description,
        price: data.price,
        deposit: data.deposit,
        borrowDuration: data.borrowDuration,
        storageLocation: data.storageLocation,
        age: data.age,
        usageKm: data.usageKm,
        usageUnit: data.usageUnit,
        purchaseDate: data.purchaseDate,
        pickupLocationId: data.pickupLocationId,
        visibility: data.visibility ?? Visibility.Private,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    router.back();
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
        <Appbar.Content title={t('addItem')} />
      </Appbar.Header>
      <ItemForm onSave={handleSave} isSubmitting={createItem.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
