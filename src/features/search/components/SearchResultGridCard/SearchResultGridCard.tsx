import { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { formatDistance } from '@/shared/utils';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable/AnimatedPressable';
import { CachedListThumbnail } from '@/shared/components/CachedListThumbnail';
import type { SearchResultItem } from '../../types';

const COLUMN_GAP = spacing.sm;
const CARD_WIDTH = (Dimensions.get('window').width - spacing.base * 2 - COLUMN_GAP) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 0.75;

interface SearchResultGridCardProps {
  item: SearchResultItem;
  onPress?: (item: SearchResultItem) => void;
}

export function SearchResultGridCard({ item, onPress }: SearchResultGridCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const themed = useThemedStyles(theme);
  const distanceText = formatDistance(item.distanceMeters);

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item)}
      style={[styles.container, themed.surfaceBg, themed.shadow]}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={styles.cardBody}>
        {[
          <View key="image" style={[styles.imageContainer, themed.surfaceVariantBg]}>
            {item.thumbnailStoragePath ? (
              <CachedListThumbnail
                uri={
                  supabase.storage.from('item-photos').getPublicUrl(item.thumbnailStoragePath).data
                    .publicUrl
                }
                cacheKey={item.thumbnailStoragePath}
                style={styles.image}
              />
            ) : (
              <MaterialCommunityIcons
                name="image-outline"
                size={iconSize.lg}
                color={theme.colors.onSurfaceVariant}
              />
            )}
          </View>,
          <View key="content" style={styles.content}>
            {[
              <Text key="name" variant="titleSmall" numberOfLines={2} style={themed.onSurface}>
                {item.name}
                {item.quantity > 1
                  ? ` ${t('result.quantitySuffix', { count: item.quantity })}`
                  : ''}
              </Text>,
              <Text
                key="condition"
                variant="labelSmall"
                style={themed.onSurfaceVariant}
                numberOfLines={1}
              >
                {t(`condition.${item.condition}`)}
              </Text>,
              distanceText ? (
                <View key="distance" style={styles.locationRow}>
                  {[
                    <MaterialCommunityIcons
                      key="pin"
                      name="map-marker-outline"
                      size={12}
                      color={theme.colors.onSurfaceVariant}
                    />,
                    <Text
                      key="distanceLabel"
                      variant="labelSmall"
                      style={themed.onSurfaceVariant}
                      numberOfLines={1}
                    >
                      {item.areaName ? `${item.areaName} · ` : ''}
                      {distanceText}
                    </Text>,
                  ]}
                </View>
              ) : null,
            ]}
          </View>,
        ]}
      </View>
    </AnimatedPressable>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        surfaceBg: { backgroundColor: theme.customColors.surfaceContainerLowest },
        surfaceVariantBg: { backgroundColor: theme.colors.surfaceVariant },
        shadow: {
          shadowColor: theme.colors.onSurface,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 1,
        },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: COLUMN_GAP,
  },
  cardBody: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.sm,
    gap: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
});
