import { useCallback } from 'react';
import { Alert, Platform, View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
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

  const handleSave = useCallback(
    (data: BikeFormData) => {
      updateBike.mutate(
        { id: bikeId, ...data },
        {
          onSuccess: () => {
            router.back();
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
    [photos, bikeId, queryClient, t],
  );

  const handleDelete = useCallback(() => {
    const doDelete = () => {
      deleteBike.mutate(bikeId, {
        onSuccess: () => {
          router.navigate('/(tabs)/inventory/bikes' as never);
        },
      });
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
  }, [deleteBike, bikeId, t]);

  if (!bike) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated={false} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
