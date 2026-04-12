import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { PhotoPicker } from '@/features/inventory/components/PhotoPicker/PhotoPicker';
import { CachedListThumbnail, ConfirmDialog, LoadingScreen } from '@/shared/components';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useUnsavedChangesExitGuard } from '@/shared/hooks/useUnsavedChangesExitGuard';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';

export default function EditBikeScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bikeId = id as BikeId;

  const { data: bike, isLoading, isSuccess: bikeReady } = useBike(bikeId);
  const { data: photos = [], isSuccess: photosReady } = useBikePhotos(bikeId);
  const [formDirty, setFormDirty] = useState(false);
  const [photoBaseline, setPhotoBaseline] = useState<string[] | undefined>(undefined);
  const updateBike = useUpdateBike();
  const deleteBike = useDeleteBike();
  const { pickAndUpload, isUploading } = useBikePhotoUpload();
  const removeBikePhoto = useRemoveBikePhoto();

  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  const photoIdsKey = useMemo(() => photos.map((p) => p.id).join('|'), [photos]);

  useEffect(() => {
    if (!bikeReady || !photosReady) return;
    const ids = photoIdsKey.length > 0 ? photoIdsKey.split('|') : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync baseline when photo query data or order changes
    setPhotoBaseline(ids);
  }, [bikeReady, photosReady, photoIdsKey]);

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

  const handleSave = useCallback(
    (data: BikeFormData) => {
      updateBike.mutate(
        { id: bikeId, ...data },
        {
          onSuccess: () => {
            showSnackbarAlert({
              message: tCommon('feedback.bikeUpdated'),
              variant: 'success',
            });
            bypassNextNavigation();
            tabScopedBack('/(tabs)/bikes' as Href);
          },
          onError: () => {
            showSnackbarAlert({
              message: tCommon('errors.generic'),
              variant: 'error',
              duration: 'long',
            });
          },
        },
      );
    },
    [updateBike, bikeId, showSnackbarAlert, tCommon, bypassNextNavigation],
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
          removeBikePhoto.mutate(
            {
              bikeId,
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
        deleteBike.mutate(bikeId, {
          onSuccess: () => {
            closeConfirm();
            showSnackbarAlert({
              message: tCommon('feedback.bikeDeleted'),
              variant: 'success',
            });
            bypassNextNavigation();
            router.navigate('/(tabs)/bikes' as Href);
          },
          onError: () => {
            closeConfirm();
            showSnackbarAlert({
              message: tCommon('errors.generic'),
              variant: 'error',
              duration: 'long',
            });
          },
        });
      },
    });
  }, [
    deleteBike,
    bikeId,
    t,
    openConfirm,
    closeConfirm,
    showSnackbarAlert,
    tCommon,
    bypassNextNavigation,
  ]);

  if (isLoading || !bike) {
    return <LoadingScreen />;
  }

  const thumbnailUri =
    photos.length > 0
      ? supabase.storage.from('item-photos').getPublicUrl(photos[0].storagePath).data.publicUrl
      : undefined;

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
            cacheKey={photos[0].storagePath}
            style={styles.heroImage}
          />
        ) : (
          <MaterialCommunityIcons name="bicycle" size={64} color={theme.colors.onSurfaceVariant} />
        )}
      </View>
      <View style={styles.heroInfo}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          {bike.name}
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
          distanceKm: bike.distanceKm,
          usageHours: bike.usageHours,
          condition: bike.condition,
          notes: bike.notes,
        }}
        headerComponent={heroSection}
        photoSection={photoSection}
        isEditMode
        onSave={handleSave}
        onDelete={handleDelete}
        isSubmitting={updateBike.isPending}
        onDirtyChange={setFormDirty}
      />
      <ConfirmDialog
        {...confirmDialogProps}
        loading={removeBikePhoto.isPending || deleteBike.isPending}
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
