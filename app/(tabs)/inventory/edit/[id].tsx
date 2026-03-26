import { useCallback } from 'react';
import { Alert, Image, Platform, View, StyleSheet } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useItem,
  useItemPhotos,
  useUpdateItem,
  useDeleteItem,
  usePhotoUpload,
} from '@/features/inventory';
import type { ItemFormData } from '@/features/inventory';
import { ItemForm } from '@/features/inventory/components/ItemForm/ItemForm';
import { PhotoPicker } from '@/features/inventory/components/PhotoPicker/PhotoPicker';
import { canDelete } from '@/features/inventory';
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen';
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
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useItem(itemId);
  const { data: photos = [] } = useItemPhotos(itemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const { pickAndUpload, isUploading } = usePhotoUpload();

  const handleSave = async (data: ItemFormData) => {
    await updateItem.mutateAsync({ ...data, id: itemId });
    router.back();
  };

  const handleAddPhoto = useCallback(() => {
    pickAndUpload(itemId);
  }, [pickAndUpload, itemId]);

  const handleSetPrimary = useCallback(
    async (photoId: string) => {
      const tapped = photos.find((p) => p.id === photoId);
      const current = photos[0];
      if (!tapped || !current || tapped.id === current.id) return;

      const tappedOrder = tapped.sortOrder;
      const currentOrder = current.sortOrder;

      await supabase.from('item_photos').update({ sort_order: currentOrder }).eq('id', tapped.id);
      await supabase.from('item_photos').update({ sort_order: tappedOrder }).eq('id', current.id);

      queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    [photos, itemId, queryClient],
  );

  const handleRemovePhoto = useCallback(
    (photoId: string) => {
      const doRemove = async () => {
        const photo = photos.find((p) => p.id === photoId);
        if (photo) {
          await supabase.storage.from('item-photos').remove([photo.storagePath]);
          await supabase.from('item_photos').delete().eq('id', photoId);
          queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });
          queryClient.invalidateQueries({ queryKey: ['items'] });
        }
      };

      if (Platform.OS === 'web') {
        if (
          window.confirm(`${t('confirm.removePhoto.title')}\n${t('confirm.removePhoto.message')}`)
        ) {
          doRemove();
        }
      } else {
        Alert.alert(t('confirm.removePhoto.title'), t('confirm.removePhoto.message'), [
          { text: t('confirm.removePhoto.cancel'), style: 'cancel' },
          { text: t('confirm.removePhoto.confirm'), style: 'destructive', onPress: doRemove },
        ]);
      }
    },
    [photos, itemId, queryClient, t],
  );

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

  const thumbnailUri =
    photos.length > 0
      ? supabase.storage.from('item-photos').getPublicUrl(photos[0].storagePath).data.publicUrl
      : item.thumbnailStoragePath
        ? supabase.storage.from('item-photos').getPublicUrl(item.thumbnailStoragePath).data
            .publicUrl
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
        photoSection={photoSection}
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
  inventoryIdLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  photoSection: {
    marginTop: spacing.md,
  },
});
