import { Alert, Image, Platform, View, StyleSheet } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useItem, useUpdateItem, useDeleteItem } from '@/features/inventory';
import type { ItemFormData } from '@/features/inventory';
import { ItemForm } from '@/features/inventory/components/ItemForm/ItemForm';
import { canDelete } from '@/features/inventory';
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { ItemId } from '@/shared/types';

function formatInventoryId(id: string): string {
  const short = id.slice(0, 8).toUpperCase();
  return `BB-${short.slice(0, 3)}-${short.slice(3, 4)}`;
}

export default function EditItemScreen() {
  const theme = useTheme<AppTheme>();
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

  const handleDelete = () => {
    if (!item || !canDelete(item)) return;

    const doDelete = async () => {
      await deleteItem.mutateAsync({ id: item.id, status: item.status });
      router.back();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${t('confirm.delete.title')}\n${t('confirm.delete.message')}`)) {
        doDelete();
      }
    } else {
      Alert.alert(t('confirm.delete.title'), t('confirm.delete.message'), [
        { text: t('confirm.delete.cancel'), style: 'cancel' },
        { text: t('confirm.delete.confirm'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const thumbnailUri = item.thumbnailStoragePath
    ? supabase.storage.from('item-photos').getPublicUrl(item.thumbnailStoragePath).data.publicUrl
    : undefined;

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

  const heroSection = (
    <View style={styles.heroContainer}>
      <View
        style={[
          styles.heroImageWrapper,
          { backgroundColor: theme.customColors.surfaceContainerHighest },
        ]}
      >
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.heroImage} />
        ) : (
          <MaterialCommunityIcons
            name="image-outline"
            size={iconSize.xl}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </View>
      <View style={styles.heroInfo}>
        <Text
          variant="labelSmall"
          style={[styles.inventoryIdLabel, { color: theme.colors.primary }]}
        >
          {t('inventoryId', { id: formatInventoryId(item.id) })}
        </Text>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          {item.name}
        </Text>
      </View>
    </View>
  );

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
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>
      <ItemForm
        initialData={initialData}
        onSave={handleSave}
        onDelete={canDelete(item) ? handleDelete : undefined}
        isSubmitting={updateItem.isPending}
        isEditMode
        headerComponent={heroSection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.md,
  },
  heroImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
  },
  heroInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  inventoryIdLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
