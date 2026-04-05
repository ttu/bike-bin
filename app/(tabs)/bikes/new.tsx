import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Snackbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Href } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useCreateBike, useBikeRowCapacity } from '@/features/bikes';
import { isBikeLimitExceededError } from '@/shared/utils/subscriptionLimitErrors';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';

export default function NewBikeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('bikes');
  const { t: tCommon } = useTranslation('common');
  const createBike = useCreateBike();
  const { atLimit, limit, isReady } = useBikeRowCapacity();
  const [limitSnackbarVisible, setLimitSnackbarVisible] = useState(false);

  const submitBlockedMessage =
    isReady && atLimit && limit !== undefined ? t('limit.reachedBanner', { limit }) : undefined;

  const handleSave = useCallback(
    (data: BikeFormData) => {
      createBike.mutate(data, {
        onSuccess: () => {
          tabScopedBack('/(tabs)/bikes' as Href);
        },
        onError: (e) => {
          if (isBikeLimitExceededError(e)) {
            setLimitSnackbarVisible(true);
          }
        },
      });
    },
    [createBike],
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
        isSubmitting={createBike.isPending}
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
});
