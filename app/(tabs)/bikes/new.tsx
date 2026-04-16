import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Snackbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router, type Href } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import {
  useCreateBike,
  useBikeRowCapacity,
  useDeleteBike,
  useStagedBikePhotos,
} from '@/features/bikes';
import {
  isBikeLimitExceededError,
  isPhotoLimitExceededError,
} from '@/shared/utils/subscriptionLimitErrors';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';
import { PhotoPicker } from '@/shared/components/PhotoPicker/PhotoPicker';
import { usePhotoPicker } from '@/shared/hooks/usePhotoPicker';
import { usePhotoRowCapacity } from '@/shared/hooks/usePhotoRowCapacity';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useValidationErrorSnackbar } from '@/shared/hooks/useValidationErrorSnackbar';
import { spacing } from '@/shared/theme';

export default function NewBikeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('bikes');
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();
  const createBike = useCreateBike();
  const deleteBike = useDeleteBike();
  const { atLimit, limit, isReady } = useBikeRowCapacity();
  const { atLimit: atPhotoLimit, isReady: photoCapacityReady } = usePhotoRowCapacity();
  const [limitSnackbarVisible, setLimitSnackbarVisible] = useState(false);
  const [errorSnackbarVisible, setErrorSnackbarVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { pickPhoto, isPicking } = usePhotoPicker();
  const { stagedPhotos, addStaged, removeStaged, uploadAll, isUploading } = useStagedBikePhotos();

  const handleAddPhoto = async () => {
    const result = await pickPhoto();
    if (result) {
      addStaged(result.uri, result.fileName);
    }
  };

  const submitBlockedMessage =
    isReady && atLimit && limit !== undefined ? t('limit.reachedBanner', { limit }) : undefined;

  const handleValidationError = useValidationErrorSnackbar();

  const handleSave = async (data: BikeFormData) => {
    setIsSaving(true);
    try {
      const bike = await createBike.mutateAsync(data);
      if (stagedPhotos.length > 0) {
        try {
          await uploadAll(bike.id);
        } catch (error: unknown) {
          if (isPhotoLimitExceededError(error)) {
            router.push(`/(tabs)/bikes/${bike.id}?photoLimitWarning=1` as Href);
            return;
          }
          await deleteBike.mutateAsync(bike.id);
          throw error;
        }
      }
      showSnackbarAlert({
        message: tCommon('feedback.bikeAdded'),
        variant: 'success',
      });
      tabScopedBack('/(tabs)/bikes' as Href);
    } catch (error: unknown) {
      if (isBikeLimitExceededError(error)) {
        setLimitSnackbarVisible(true);
      } else if (!isPhotoLimitExceededError(error)) {
        setErrorSnackbarVisible(true);
      }
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
        accountPhotoLimitReached={photoCapacityReady && atPhotoLimit}
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
        <Appbar.Content title={t('addBike')} />
      </Appbar.Header>
      <BikeForm
        onSave={handleSave}
        isSubmitting={isSaving || createBike.isPending}
        submitBlockedMessage={submitBlockedMessage}
        photoSection={photoSection}
        onValidationError={handleValidationError}
      />
      <Snackbar
        visible={limitSnackbarVisible}
        onDismiss={() => setLimitSnackbarVisible(false)}
        duration={5000}
        action={{ label: tCommon('actions.close'), onPress: () => setLimitSnackbarVisible(false) }}
      >
        {t('limit.saveSnackbar')}
      </Snackbar>
      <Snackbar
        visible={errorSnackbarVisible}
        onDismiss={() => setErrorSnackbarVisible(false)}
        duration={5000}
        action={{ label: tCommon('actions.close'), onPress: () => setErrorSnackbarVisible(false) }}
      >
        {t('limit.saveFailed')}
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
