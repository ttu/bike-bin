import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/shared/types';
import { ItemStatus } from '@/shared/types';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { AppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable/AnimatedPressable';
import { CachedListThumbnail } from '@/shared/components/CachedListThumbnail';
import { getStatusColor, type StatusColorToken } from '../../utils/status';
import { ITEM_INVENTORY_THUMBNAIL } from '../../constants';
import { availabilityTypesForList } from '../../utils/availabilityList';
import { getItemThumbnailPublicUrl } from '../../utils/itemThumbnailPublicUrl';

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  compact?: boolean;
}

export const ItemCard = memo(function ItemCard({ item, onPress, compact = false }: ItemCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  const statusColorToken = getStatusColor(item.status);
  const statusColorMap: Record<StatusColorToken, string> = {
    warning: theme.customColors.warning,
    success: theme.customColors.success,
    outline: theme.colors.outline,
  };
  const statusColor = statusColorMap[statusColorToken];

  const listAvailability = availabilityTypesForList(item.availabilityTypes);
  const thumbnailUri = getItemThumbnailPublicUrl(item.thumbnailStoragePath);

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item)}
      style={[
        styles.container,
        {
          backgroundColor: theme.customColors.surfaceContainerLowest,
          shadowColor: theme.colors.onSurface,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        item.quantity > 1
          ? t('card.a11yNameWithQuantity', { name: item.name, count: item.quantity })
          : item.name
      }
    >
      <View
        style={[
          styles.thumbnail,
          {
            width: ITEM_INVENTORY_THUMBNAIL.width,
            height: ITEM_INVENTORY_THUMBNAIL.height,
            backgroundColor: theme.colors.surfaceVariant,
          },
        ]}
      >
        {thumbnailUri ? (
          <CachedListThumbnail
            uri={thumbnailUri}
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
        <View style={styles.header}>
          <Text
            variant="titleMedium"
            numberOfLines={1}
            style={[styles.name, { color: theme.colors.onSurface }]}
          >
            {item.name}
          </Text>
          {item.status !== ItemStatus.Stored && (
            <View
              style={[styles.statusChip, { backgroundColor: colorWithAlpha(statusColor, 0.2) }]}
            >
              <Text variant="labelSmall" style={{ color: statusColor }}>
                {t(`status.${item.status}`)}
              </Text>
            </View>
          )}
        </View>

        {!compact && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {t(`category.${item.category}`)}
            {item.subcategory ? ` · ${t(`subcategory.${item.subcategory}`)}` : ''}
          </Text>
        )}

        {!compact && (listAvailability.length > 0 || item.tags.length > 0 || item.quantity > 1) && (
          <View style={styles.chips}>
            {item.quantity > 1 && (
              <View
                style={[styles.availabilityChip, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text
                  variant="labelSmall"
                  style={[styles.chipText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t('card.quantityChip', { count: item.quantity })}
                </Text>
              </View>
            )}
            {listAvailability.map((type) => (
              <View
                key={type}
                style={[styles.availabilityChip, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text
                  variant="labelSmall"
                  style={[styles.chipText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t(`availability.${type}`)}
                </Text>
              </View>
            ))}
            {item.tags.map((tag) => (
              <View
                key={`tag:${tag}`}
                style={[styles.availabilityChip, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text
                  variant="labelSmall"
                  style={[styles.chipText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  thumbnail: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  chips: {
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
});
