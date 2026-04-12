import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
import { CachedListThumbnail, ConfirmDialog, LoadingScreen } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useUnsavedChangesExitGuard } from '@/shared/hooks/useUnsavedChangesExitGuard';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { ItemId } from '@/shared/types';

export default function EditItemScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = id as ItemId;

  const { data: item, isLoading, isSuccess: itemReady } = useItem(itemId);
  const { data: photos = [], isSuccess: photosReady } = useItemPhotos(itemId);
  const [formDirty, setFormDirty] = useState(false);
  const [photoBaseline, setPhotoBaseline] = useState<string[] | undefined>(undefined);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const { pickAndUpload, isUploading } = usePhotoUpload();
  const swapPhotoOrder = useSwapItemPhotoOrder();
  const removePhoto = useRemoveItemPhoto();

  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  const photoIdsKey = useMemo(() => photos.map((p) => p.id).join('|'), [photos]);

  useEffect(() => {
    if (!itemReady || !photosReady) return;
    const ids = photoIdsKey.length > 0 ? photoIdsKey.split('|') : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync baseline when photo query data or order changes
    setPhotoBaseline(ids);
  }, [itemReady, photosReady, photoIdsKey]);

  const photosDirty = useMemo(() => {
    if (photoBaseline === undefined) return false;
    if (photos.length !== photoBaseline.length) return true;
    return photos.some((p, i) => p.id !== photoBaseline[i]);
  }, [photos, photoBaseline]);

  const isScreenDirty = formDirty || photosDirty;

  const { bypassNextNavigation } = useUnsavedChangesExitGuard({
    isDirty: isScreenDirty,
    title: tCommon('unsavedChanges.title'),
    message: tCommon('unsavedChanges.message'),
    confirmLabel: tCommon('unsavedChanges.discard'),
    cancelLabel: tCommon('unsavedChanges.keepEditing'),
    openConfirm,
    closeConfirm,
  });

  const handleSave = async (data: ItemFormData) => {
    try {
      await updateItem.mutateAsync({ ...data, id: itemId });
      showSnackbarAlert({
        message: tCommon('feedback.itemUpdated'),
        variant: 'success',
      });
      bypassNextNavigation();
      tabScopedBack('/(tabs)/inventory');
    } catch {
      showSnackbarAlert({
        message: tCommon('errors.generic'),
        variant: 'error',
        duration: 'long',
      });
    }
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
          removePhoto.mutate(
            {
              itemId,
              photoId,
              storagePath: photo.storagePath,
            },
            {
              onSettled: () => {
                closeConfirm();
              },
            },
          );
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
      onConfirm: async () => {
        try {
          await deleteItem.mutateAsync({ id: item.id, status: item.status });
          closeConfirm();
          showSnackbarAlert({
            message: tCommon('feedback.itemDeleted'),
            variant: 'success',
          });
          bypassNextNavigation();
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
  const thumbnailCacheKey = photos.length > 0 ? photos[0].storagePath : item.thumbnailStoragePath;

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
    mountedDate: item.mountedDate,
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
          <CachedListThumbnail
            uri={thumbnailUri}
            cacheKey={thumbnailCacheKey ?? thumbnailUri}
            style={styles.heroImage}
          />
        ) : (
          <MaterialCommunityIcons
            name="image-outline"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </View>
      <View style={styles.heroInfo}>
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
        onDirtyChange={setFormDirty}
      />
      <ConfirmDialog
        {...confirmDialogProps}
        loading={removePhoto.isPending || swapPhotoOrder.isPending || deleteItem.isPending}
      />
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
  photoSection: {
    marginTop: spacing.md,
  },
});
