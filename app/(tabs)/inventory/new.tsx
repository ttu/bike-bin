import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Snackbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useAuth } from '@/features/auth';
import {
  useCreateItem,
  useInventoryRowCapacity,
  isInventoryLimitExceededError,
  isPhotoLimitExceededError,
} from '@/features/inventory';
import { usePhotoRowCapacity } from '@/shared/hooks/usePhotoRowCapacity';
import { useLocalInventory } from '@/features/inventory/hooks/useLocalInventory';
import type { ItemFormData } from '@/features/inventory';
import { ItemForm } from '@/features/inventory/components/ItemForm/ItemForm';
import { PhotoPicker } from '@/features/inventory/components/PhotoPicker/PhotoPicker';
import { usePhotoPicker } from '@/features/inventory/hooks/usePhotoPicker';
import { useStagedPhotos } from '@/features/inventory/hooks/useStagedPhotos';
import { ItemCategory, ItemStatus, Visibility } from '@/shared/types';
import type { BorrowDuration } from '@/shared/types';
import { spacing } from '@/shared/theme';
import type { ItemId } from '@/shared/types';
import { LOCAL_USER_ID } from '@/shared/types';

export default function NewItemScreen() {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const { t: tCommon } = useTranslation('common');
  const { isAuthenticated } = useAuth();
  const createItem = useCreateItem();
  const { addItem } = useLocalInventory();
  const { atLimit, limit, isReady } = useInventoryRowCapacity();
  const { atLimit: atPhotoLimit, isReady: photoCapacityReady } = usePhotoRowCapacity();
  const [limitSnackbarVisible, setLimitSnackbarVisible] = useState(false);
  const { category } = useLocalSearchParams<{ category?: string }>();
  const initialCategory = Object.values(ItemCategory).includes(category as ItemCategory)
    ? (category as ItemCategory)
    : undefined;

  const { pickPhoto, isPicking } = usePhotoPicker();
  const { stagedPhotos, addStaged, removeStaged, uploadAll, isUploading } = useStagedPhotos();
  const [isSaving, setIsSaving] = useState(false);

  const handleAddPhoto = async () => {
    const result = await pickPhoto();
    if (result) {
      addStaged(result.uri, result.fileName);
    }
  };

  const submitBlockedMessage =
    isAuthenticated && isReady && atLimit && limit !== undefined
      ? t('limit.reachedBanner', { limit })
      : undefined;

  const handleSave = async (data: ItemFormData) => {
    setIsSaving(true);
    try {
      if (isAuthenticated) {
        try {
          const item = await createItem.mutateAsync(data);
          if (stagedPhotos.length > 0) {
            try {
              await uploadAll(item.id);
            } catch (pe) {
              if (isPhotoLimitExceededError(pe)) {
                router.push(`/(tabs)/inventory/${item.id}?photoLimitWarning=1`);
                return;
              }
              throw pe;
            }
          }
        } catch (e) {
          if (isInventoryLimitExceededError(e)) {
            setLimitSnackbarVisible(true);
            return;
          }
          throw e;
        }
      } else {
        await addItem({
          id: crypto.randomUUID() as ItemId,
          ownerId: LOCAL_USER_ID,
          bikeId: undefined,
          name: data.name,
          category: data.category!,
          subcategory: data.subcategory,
          condition: data.condition!,
          quantity: data.quantity ?? 1,
          status: ItemStatus.Stored,
          availabilityTypes: data.availabilityTypes,
          brand: data.brand,
          model: data.model,
          description: data.description,
          price: data.price,
          deposit: data.deposit,
          borrowDuration: (data.borrowDuration as BorrowDuration) || undefined,
          storageLocation: data.storageLocation,
          age: data.age,
          usageKm: data.usageKm,
          remainingFraction: data.remainingFraction,
          purchaseDate: data.purchaseDate,
          mountedDate: data.mountedDate,
          pickupLocationId: data.pickupLocationId,
          visibility: data.visibility ?? Visibility.Private,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          thumbnailStoragePath: undefined,
        });
      }
      tabScopedBack('/(tabs)/inventory');
    } finally {
      setIsSaving(false);
    }
  };

  const photoSection = (
    <View style={styles.photoSection}>
      <PhotoPicker
        photos={stagedPhotos}
        onAdd={handleAddPhoto}
        onRemove={removeStaged}
        isUploading={isPicking || isUploading}
        accountPhotoLimitReached={isAuthenticated && photoCapacityReady && atPhotoLimit}
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
        <Appbar.Content title={t('addItem')} />
      </Appbar.Header>
      <ItemForm
        initialCategory={initialCategory}
        onSave={handleSave}
        isSubmitting={isSaving || createItem.isPending}
        photoSection={photoSection}
        submitBlockedMessage={submitBlockedMessage}
      />
      <Snackbar
        visible={limitSnackbarVisible}
        onDismiss={() => setLimitSnackbarVisible(false)}
        duration={5000}
        action={{ label: tCommon('actions.close'), onPress: () => setLimitSnackbarVisible(false) }}
      >
        {t('limit.saveSnackbar')}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  photoSection: {
    marginTop: spacing.md,
  },
});
