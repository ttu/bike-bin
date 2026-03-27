import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, router } from 'expo-router';
import type { BikeId, Bike } from '@/shared/types';
import type { TFunction } from 'i18next';
import type { AppTheme } from '@/shared/theme';
import { useBike, useBikePhotos } from '@/features/bikes';
import { MountedParts } from '@/features/bikes/components/MountedParts/MountedParts';
import { PhotoGallery } from '@/shared/components';
import { spacing, borderRadius } from '@/shared/theme';

const WIDE_BREAKPOINT = 768;

export default function BikeDetailScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');
  const { id } = useLocalSearchParams<{ id: string }>();
  const bikeId = id as BikeId;

  const { data: bike, isLoading } = useBike(bikeId);
  const { data: photos = [] } = useBikePhotos(bikeId);
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= WIDE_BREAKPOINT;

  if (isLoading || !bike) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated={false} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)/inventory/bikes')
          }
        />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="pencil"
          onPress={() => router.push(`/(tabs)/inventory/bikes/edit/${bike.id}` as never)}
        />
      </Appbar.Header>
      {isWide ? (
        <View style={styles.wideContainer}>
          <View style={styles.wideGallery}>
            <PhotoGallery photos={photos} />
          </View>
          <ScrollView style={styles.wideDetails} contentContainerStyle={styles.content}>
            <BikeDetails bike={bike} bikeId={bikeId} theme={theme} t={t} />
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <PhotoGallery photos={photos} />
          <BikeDetails bike={bike} bikeId={bikeId} theme={theme} t={t} />
        </ScrollView>
      )}
    </View>
  );
}

function BikeDetails({
  bike,
  bikeId,
  theme,
  t,
}: {
  bike: Bike;
  bikeId: BikeId;
  theme: AppTheme;
  t: TFunction<'bikes'>;
}) {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {bike.name}
        </Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wideContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  wideGallery: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.base,
  },
  wideDetails: {
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
