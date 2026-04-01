import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useLocalSearchParams, router, type Href } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import type { BikeId } from '@/shared/types';
import {
  useBike,
  useBikePhotos,
  useUpdateBike,
  useDeleteBike,
  useBikePhotoUpload,
  useRemoveBikePhoto,
} from '@/features/bikes';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';
import { ConfirmDialog } from '@/shared/components';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

export default function EditBikeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('bikes');
  const { id } = useLocalSearchParams<{ id: string }>();
  const bikeId = id as BikeId;

  const { data: bike } = useBike(bikeId);
  const { data: photos = [] } = useBikePhotos(bikeId);
  const updateBike = useUpdateBike();
  const deleteBike = useDeleteBike();
  const { pickAndUpload, isUploading } = useBikePhotoUpload();
  const removeBikePhoto = useRemoveBikePhoto();

  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  const handleSave = useCallback(
    (data: BikeFormData) => {
      updateBike.mutate(
        { id: bikeId, ...data },
        {
          onSuccess: () => {
            tabScopedBack('/(tabs)/bikes' as Href);
          },
        },
      );
    },
    [updateBike, bikeId],
  );

  const handleAddPhoto = useCallback(() => {
    pickAndUpload(bikeId);
  }, [pickAndUpload, bikeId]);

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
          removeBikePhoto.mutate({
            bikeId,
            photoId,
            storagePath: photo.storagePath,
          });
        },
      });
    },
    [photos, bikeId, removeBikePhoto, t, openConfirm, closeConfirm],
  );

  const handleDelete = useCallback(() => {
    openConfirm({
      title: t('confirm.delete.title'),
      message: t('confirm.delete.message'),
      cancelLabel: t('confirm.delete.cancel'),
      confirmLabel: t('confirm.delete.confirm'),
      destructive: true,
      onConfirm: () => {
        closeConfirm();
        deleteBike.mutate(bikeId, {
          onSuccess: () => {
            router.navigate('/(tabs)/bikes' as Href);
          },
        });
      },
    });
  }, [deleteBike, bikeId, t, openConfirm, closeConfirm]);

  if (!bike) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        dark={theme.dark}
        elevated={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/bikes' as Href)} />
        <Appbar.Content title={t('editBike')} />
      </Appbar.Header>
      <BikeForm
        initialData={{
          name: bike.name,
          brand: bike.brand ?? undefined,
          model: bike.model ?? undefined,
          type: bike.type,
          year: bike.year ?? undefined,
        }}
        bikeId={bikeId}
        photos={photos}
        onAddPhoto={handleAddPhoto}
        onRemovePhoto={handleRemovePhoto}
        isUploadingPhoto={isUploading}
        onSave={handleSave}
        onDelete={handleDelete}
        isSubmitting={updateBike.isPending}
      />
      <ConfirmDialog {...confirmDialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
