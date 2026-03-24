import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useCreateBike } from '@/features/bikes';
import { BikeForm } from '@/features/bikes/components/BikeForm/BikeForm';
import type { BikeFormData } from '@/features/bikes';

export default function NewBikeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('bikes');
  const createBike = useCreateBike();

  const handleSave = useCallback(
    (data: BikeFormData) => {
      createBike.mutate(data, {
        onSuccess: () => {
          router.back();
        },
      });
    },
    [createBike],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated={false} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('addBike')} />
      </Appbar.Header>
      <BikeForm onSave={handleSave} isSubmitting={createBike.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
