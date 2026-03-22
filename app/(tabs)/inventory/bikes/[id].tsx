import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BikeId } from '@/shared/types';
import { useBike, useBikePhotos } from '@/features/bikes';
import { MountedParts } from '@/features/bikes/components/MountedParts/MountedParts';
import { PhotoGallery } from '@/shared/components';
import { spacing, borderRadius } from '@/shared/theme';

export default function BikeDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('bikes');
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bikeId = id as BikeId;

  const { data: bike, isLoading } = useBike(bikeId);
  const { data: photos = [] } = useBikePhotos(bikeId);

  if (isLoading || !bike) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      />
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
      contentContainerStyle={styles.content}
    >
      <PhotoGallery photos={photos} />

      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {bike.name}
        </Text>
        <Button
          mode="text"
          compact
          onPress={() => router.push(`/(tabs)/inventory/bikes/edit/${bike.id}` as never)}
        >
          {t('detail.edit')}
        </Button>
      </View>

      {/* Info card */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
        {bike.brand && (
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('detail.brand')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {bike.brand}
            </Text>
          </View>
        )}
        {bike.model && (
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('detail.model')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {bike.model}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('detail.type')}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {t(`bikeType.${bike.type}`)}
          </Text>
        </View>
        {bike.year && (
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('detail.year')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {bike.year}
            </Text>
          </View>
        )}
      </View>

      {/* Mounted parts */}
      <MountedParts bikeId={bikeId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  infoCard: {
    marginHorizontal: spacing.base,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
