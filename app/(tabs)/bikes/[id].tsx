import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, router, type Href } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import type { BikeId, Bike } from '@/shared/types';
import type { TFunction } from 'i18next';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { useBike, useBikePhotos } from '@/features/bikes';
import { MountedParts } from '@/features/bikes/components/MountedParts/MountedParts';
import { formatBikeMetric } from '@/features/bikes/utils/formatBikeDetail';
import { PhotoGallery } from '@/shared/components';
import { getWideDetailLayout, WIDE_DETAIL_PAGE_MAX_WIDTH } from '@/shared/utils/wideDetailLayout';

export default function BikeDetailScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');
  const { id } = useLocalSearchParams<{ id: string }>();
  const bikeId = id as BikeId;

  const { data: bike, isLoading } = useBike(bikeId);
  const { data: photos = [] } = useBikePhotos(bikeId);
  const { width: windowWidth } = useWindowDimensions();
  const { isWide, splitLayout, galleryMaxWidth } = getWideDetailLayout(windowWidth);

  if (isLoading || !bike) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        dark={theme.dark}
        elevated={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/bikes' as Href)} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="pencil"
          accessibilityLabel={t('detail.edit')}
          onPress={() => router.push(`/(tabs)/bikes/edit/${bike.id}`)}
        />
      </Appbar.Header>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isWide && styles.wideScrollContent,
          splitLayout && styles.wideSplitScrollContent,
        ]}
      >
        {splitLayout ? (
          <View style={styles.wideSplitRow}>
            <View style={styles.wideSplitLeft}>
              <PhotoGallery photos={photos} maxGalleryWidth={galleryMaxWidth} />
            </View>
            <View style={[styles.wideSplitRight, { borderLeftColor: theme.colors.outlineVariant }]}>
              <BikeDetails bike={bike} bikeId={bikeId} theme={theme} t={t} />
            </View>
          </View>
        ) : (
          <View style={isWide ? styles.widePageInner : undefined}>
            <PhotoGallery photos={photos} maxGalleryWidth={galleryMaxWidth} />
            <BikeDetails bike={bike} bikeId={bikeId} theme={theme} t={t} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function BikeDetails({
  bike,
  bikeId,
  theme,
  t,
}: Readonly<{
  bike: Bike;
  bikeId: BikeId;
  theme: AppTheme;
  t: TFunction<'bikes'>;
}>) {
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
        <View style={styles.infoRow}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('detail.condition')}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {t(`condition.${bike.condition}`)}
          </Text>
        </View>
        {bike.distanceKm != null && (
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('detail.distance')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {t('detail.distanceKm', { value: formatBikeMetric(bike.distanceKm) })}
            </Text>
          </View>
        )}
        {bike.usageHours != null && (
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('detail.usageHours')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {t('detail.hoursValue', { value: formatBikeMetric(bike.usageHours) })}
            </Text>
          </View>
        )}
      </View>

      {bike.notes ? (
        <View style={[styles.notesCard, { backgroundColor: theme.colors.surface }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('detail.notes')}
          </Text>
          <Text variant="bodyMedium" style={[styles.notesBody, { color: theme.colors.onSurface }]}>
            {bike.notes}
          </Text>
        </View>
      ) : null}

      {/* Mounted parts */}
      <MountedParts bikeId={bikeId} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  wideScrollContent: {
    flexGrow: 1,
  },
  widePageInner: {
    width: '100%',
    maxWidth: WIDE_DETAIL_PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  wideSplitScrollContent: {
    paddingHorizontal: spacing.base,
  },
  wideSplitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: WIDE_DETAIL_PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  wideSplitLeft: {
    flex: 1,
    minWidth: 280,
  },
  wideSplitRight: {
    flex: 1,
    minWidth: 280,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.lg,
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
  notesCard: {
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  notesBody: {
    marginTop: spacing.xs,
  },
});
