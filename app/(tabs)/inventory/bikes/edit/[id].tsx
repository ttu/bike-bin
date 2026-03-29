import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import type { BikeId } from '@/shared/types';
import {
  useBike,
  useBikePhotos,
  useUpdateBike,
  useDeleteBike,
  useBikePhotoUpload,
} from '@/features/bikes';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';
import { supabase } from '@/shared/api/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/shared/components';

type EditBikeConfirmConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

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
  const queryClient = useQueryClient();

  const [confirm, setConfirm] = useState<EditBikeConfirmConfig | null>(null);

  const handleSave = useCallback(
    (data: BikeFormData) => {
      updateBike.mutate(
        { id: bikeId, ...data },
        {
          onSuccess: () => {
            tabScopedBack('/(tabs)/inventory/bikes');
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
      const doRemove = async () => {
        const photo = photos.find((p) => p.id === photoId);
        if (photo) {
          await supabase.storage.from('item-photos').remove([photo.storagePath]);
          await supabase.from('bike_photos').delete().eq('id', photoId);
          queryClient.invalidateQueries({ queryKey: ['bike_photos', bikeId] });
          queryClient.invalidateQueries({ queryKey: ['bikes'] });
        }
      };

      setConfirm({
        title: t('confirm.removePhoto.title'),
        message: t('confirm.removePhoto.message'),
        cancelLabel: t('confirm.removePhoto.cancel'),
        confirmLabel: t('confirm.removePhoto.confirm'),
        destructive: true,
        onConfirm: () => {
          setConfirm(null);
          void doRemove();
        },
      });
    },
    [photos, bikeId, queryClient, t],
  );

  const handleDelete = useCallback(() => {
    setConfirm({
      title: t('confirm.delete.title'),
      message: t('confirm.delete.message'),
      cancelLabel: t('confirm.delete.cancel'),
      confirmLabel: t('confirm.delete.confirm'),
      destructive: true,
      onConfirm: () => {
        setConfirm(null);
        deleteBike.mutate(bikeId, {
          onSuccess: () => {
            router.navigate('/(tabs)/inventory/bikes' as never);
          },
        });
      },
    });
  }, [deleteBike, bikeId, t]);

  if (!bike) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated={false} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/inventory/bikes')} />
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
      <ConfirmDialog
        visible={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel ?? ''}
        cancelLabel={confirm?.cancelLabel}
        destructive={confirm?.destructive}
        onDismiss={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
