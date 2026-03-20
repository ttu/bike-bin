import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { formatDistance } from '@/shared/utils';
import type { SearchResultItem } from '../../types';

interface SearchResultCardProps {
  item: SearchResultItem;
  onPress?: (item: SearchResultItem) => void;
  onOwnerPress?: (ownerId: string) => void;
}

export function SearchResultCard({ item, onPress, onOwnerPress }: SearchResultCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const themed = useThemedStyles(theme);

  const distanceText = formatDistance(item.distanceMeters);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[styles.container, themed.surfaceBg]}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      {/* Thumbnail placeholder */}
      <View style={[styles.thumbnail, themed.surfaceVariantBg]}>
        <MaterialCommunityIcons
          name="image-outline"
          size={iconSize.lg}
          color={theme.colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.content}>
        {/* Name + condition */}
        <Text variant="titleMedium" numberOfLines={1} style={[styles.name, themed.onSurface]}>
          {item.name}
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
              onOwnerPress?.(item.ownerId);
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
    </Pressable>
  );
}

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
  },
  thumbnail: {
    width: 88,
    height: 66,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
  chipText: {
    fontSize: 11,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 2,
  },
});
