import { memo, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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

interface SearchResultCardProps {
  readonly item: SearchResultItem;
  readonly onPress?: (item: SearchResultItem) => void;
  readonly onOwnerPress?: (ownerId: string) => void;
}

export const SearchResultCard = memo(function SearchResultCard({
  item,
  onPress,
  onOwnerPress,
}: SearchResultCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const themed = useThemedStyles(theme);

  const distanceText = formatDistance(item.distanceMeters);

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item)}
      style={[styles.container, themed.surfaceBg]}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={[styles.thumbnail, themed.surfaceVariantBg]}>
        {item.thumbnailStoragePath ? (
          <CachedListThumbnail
            uri={
              supabase.storage.from('item-photos').getPublicUrl(item.thumbnailStoragePath).data
                .publicUrl
            }
            cacheKey={item.thumbnailStoragePath}
            style={styles.thumbnailImage}
          />
        ) : (
          <MaterialCommunityIcons
            name="image-outline"
            size={iconSize.lg}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </View>

      <View style={styles.content}>
        {/* Name + condition */}
        <Text variant="titleMedium" numberOfLines={1} style={[styles.name, themed.onSurface]}>
          {item.name}
          {item.quantity > 1 ? ` ${t('result.quantitySuffix', { count: item.quantity })}` : ''}
        </Text>

        <Text variant="bodySmall" style={themed.onSurfaceVariant} numberOfLines={1}>
          {t(`condition.${item.condition}`)}
        </Text>

        {/* Owner name */}
        {item.ownerDisplayName ? (
          <Text
            variant="labelSmall"
            style={themed.primary}
            numberOfLines={1}
            onPress={(e) => {
              e.stopPropagation();
              if (item.ownerId) onOwnerPress?.(item.ownerId);
            }}
            accessibilityRole="link"
          >
            {item.ownerDisplayName}
          </Text>
        ) : null}

        {/* Availability chips */}
        {item.availabilityTypes.length > 0 && (
          <View style={styles.chipRow}>
            {item.availabilityTypes.map((type) => (
              <View key={type} style={[styles.availabilityChip, themed.surfaceVariantBg]}>
                <Text variant="labelSmall" style={[styles.chipText, themed.onSurfaceVariant]}>
                  {t(`availability.${type}`)}
                  {type === 'sellable' && item.price !== undefined ? ` · \u20AC${item.price}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Area + distance */}
        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={themed.onSurfaceVariant} numberOfLines={1}>
            {item.areaName ? `${item.areaName}` : ''}
            {item.areaName && distanceText ? ' · ' : ''}
            {distanceText}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
});

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
        surfaceBg: { backgroundColor: theme.colors.surface },
        surfaceVariantBg: { backgroundColor: theme.colors.surfaceVariant },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      default: {},
    }),
    elevation: 1,
  },
  thumbnail: {
    width: 88,
    height: 66,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden' as const,
  },
  thumbnailImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  name: {
    marginBottom: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  availabilityChip: {
    height: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  chipText: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
});
