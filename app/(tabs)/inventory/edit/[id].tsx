import { useCallback } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import {
  useItem,
  useItemPhotos,
  useUpdateItem,
  useDeleteItem,
  usePhotoUpload,
  useSwapItemPhotoOrder,
  useRemoveItemPhoto,
} from '@/features/inventory';
import type { ItemFormData } from '@/features/inventory';
import { ItemForm } from '@/features/inventory/components/ItemForm/ItemForm';
import { PhotoPicker } from '@/features/inventory/components/PhotoPicker/PhotoPicker';
import { canDelete } from '@/features/inventory';
import { ConfirmDialog, LoadingScreen } from '@/shared/components';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { ItemId } from '@/shared/types';

function formatInventoryId(id: string): string {
  const short = id.slice(0, 8).toUpperCase();
  return `BB-${short.slice(0, 3)}-${short.slice(3, 4)}`;
}

export default function EditItemScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = id as ItemId;

  const { data: item, isLoading } = useItem(itemId);
  const { data: photos = [] } = useItemPhotos(itemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const { pickAndUpload, isUploading } = usePhotoUpload();
  const swapPhotoOrder = useSwapItemPhotoOrder();
  const removePhoto = useRemoveItemPhoto();

  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  const handleSave = async (data: ItemFormData) => {
    await updateItem.mutateAsync({ ...data, id: itemId });
    tabScopedBack('/(tabs)/inventory');
  };

  const handleAddPhoto = useCallback(() => {
    pickAndUpload(itemId);
  }, [pickAndUpload, itemId]);

  const handleSetPrimary = useCallback(
    (photoId: string) => {
      const tapped = photos.find((p) => p.id === photoId);
      const current = photos[0];
      if (!tapped || !current || tapped.id === current.id) return;

      swapPhotoOrder.mutate({
        itemId,
        photoIdA: tapped.id,
        sortOrderA: tapped.sortOrder,
        photoIdB: current.id,
        sortOrderB: current.sortOrder,
      });
    },
    [photos, itemId, swapPhotoOrder],
  );

  const handleRemovePhoto = useCallback(
    (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) return;

      openConfirm({
        title: t('confirm.removePhoto.title'),
        message: t('confirm.removePhoto.message'),
        cancelLabel: t('confirm.removePhoto.cancel'),
        confirmLabel: t('confirm.removePhoto.confirm'),
        destructive: true,
        onConfirm: () => {
          closeConfirm();
          removePhoto.mutate({
            itemId,
            photoId,
            storagePath: photo.storagePath,
          });
        },
      });
    },
    [photos, itemId, removePhoto, t, openConfirm, closeConfirm],
  );

  const handleDelete = () => {
    if (!item || !canDelete(item)) return;

    openConfirm({
      title: t('confirm.delete.title'),
      message: t('confirm.delete.message'),
      cancelLabel: t('confirm.delete.cancel'),
      confirmLabel: t('confirm.delete.confirm'),
      destructive: true,
      onConfirm: () => {
        closeConfirm();
        void (async () => {
          await deleteItem.mutateAsync({ id: item.id, status: item.status });
          tabScopedBack('/(tabs)/inventory');
        })();
      },
    });
  };

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const thumbnailUri =
    photos.length > 0
      ? supabase.storage.from('item-photos').getPublicUrl(photos[0].storagePath).data.publicUrl
      : item.thumbnailStoragePath
        ? supabase.storage.from('item-photos').getPublicUrl(item.thumbnailStoragePath).data
            .publicUrl
        : undefined;

  const initialData: ItemFormData = {
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    subcategory: item.subcategory,
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
    remainingFraction: item.remainingFraction,
    purchaseDate: item.purchaseDate,
    pickupLocationId: item.pickupLocationId,
    visibility: item.visibility,
    tags: item.tags,
  };

  const pickerPhotos = photos.map((p) => ({
    id: p.id,
    storagePath: p.storagePath,
  }));

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
            size={64}
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

  const photoSection = (
    <View style={styles.photoSection}>
      <PhotoPicker
        photos={pickerPhotos}
        onAdd={handleAddPhoto}
        onRemove={handleRemovePhoto}
        onSetPrimary={handleSetPrimary}
        isUploading={isUploading}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        dark={theme.dark}
        elevated={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/inventory')} />
        <Appbar.Content title={t('editItem')} />
      </Appbar.Header>
      <ItemForm
        initialData={initialData}
        onSave={handleSave}
        onDelete={canDelete(item) ? handleDelete : undefined}
        isSubmitting={updateItem.isPending}
        isEditMode
        headerComponent={heroSection}
        photoSection={photoSection}
      />
      <ConfirmDialog {...confirmDialogProps} />
    </View>
  );
}

const HERO_SIZE = 160;

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
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: HERO_SIZE,
    height: HERO_SIZE,
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
  photoSection: {
    marginTop: spacing.md,
  },
});
