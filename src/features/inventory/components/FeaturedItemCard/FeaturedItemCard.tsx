import { memo, useMemo } from 'react';
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
import { getItemThumbnailPublicUrl } from '../../utils/itemThumbnailPublicUrl';

const HERO_IMAGE_HEIGHT = 200;

interface FeaturedItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  badgeLabel?: string;
}

export const FeaturedItemCard = memo(function FeaturedItemCard({
  item,
  onPress,
  badgeLabel,
}: FeaturedItemCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  const statusColorToken = getStatusColor(item.status);
  const statusColorMap: Record<StatusColorToken, string> = {
    warning: theme.customColors.warning,
    success: theme.customColors.success,
    outline: theme.colors.outline,
  };
  const statusColor = statusColorMap[statusColorToken];

  const styles = useMemo(() => getStyles(theme, statusColor), [theme, statusColor]);

  const thumbnailUri = getItemThumbnailPublicUrl(item.thumbnailStoragePath);

  const specs: Array<{ value: string; label: string }> = [];

  if (item.condition) {
    specs.push({
      value: t(`condition.${item.condition}`),
      label: t('detail.conditionLabel'),
    });
  }

  if (item.quantity > 1) {
    specs.push({
      value: t('card.quantityChip', { count: item.quantity }),
      label: t('detail.quantityLabel'),
    });
  }

  const separator = t('card.metaSeparator');
  const metaParts = [
    t(`category.${item.category}`),
    ...(item.subcategory ? [t(`subcategory.${item.subcategory}`)] : []),
    ...(item.brand ? [item.brand] : []),
  ];

  return (
    <AnimatedPressable
      onPress={onPress ? () => onPress(item) : undefined}
      style={styles.container}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={t('hero.a11yLabel', { name: item.name })}
    >
      <View style={styles.imageContainer}>
        {thumbnailUri ? (
          <CachedListThumbnail
            uri={thumbnailUri}
            cacheKey={item.thumbnailStoragePath}
            style={styles.image}
          />
        ) : (
          <MaterialCommunityIcons
            name="image-outline"
            size={iconSize.lg * 2}
            color={theme.colors.onSurfaceVariant}
          />
        )}

        {item.status !== ItemStatus.Stored && (
          <View style={styles.statusBadge}>
            <Text variant="labelMedium" style={styles.statusText}>
              {t(`status.${item.status}`)}
            </Text>
          </View>
        )}

        {badgeLabel && (
          <View style={styles.recentBadge}>
            <Text variant="labelSmall" style={styles.recentBadgeText}>
              {badgeLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text variant="headlineMedium" numberOfLines={1} style={styles.titleText}>
          {item.name}
        </Text>

        <Text variant="bodyMedium" style={styles.metaText} numberOfLines={1}>
          {metaParts.join(separator)}
        </Text>

        {specs.length > 0 && (
          <View style={styles.specs}>
            {specs.map((spec) => (
              <View key={spec.label} style={styles.specItem}>
                <Text variant="headlineSmall" style={styles.specValue}>
                  {spec.value}
                </Text>
                <Text variant="labelSmall" style={styles.specLabel}>
                  {spec.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
});

function getStyles(theme: AppTheme, statusColor: string) {
  return StyleSheet.create({
    container: {
      borderRadius: borderRadius.lg,
      marginHorizontal: spacing.base,
      marginVertical: spacing.xs,
      backgroundColor: theme.customColors.surfaceContainerLowest,
      shadowColor: theme.colors.onSurface,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
      overflow: 'hidden' as const,
    },
    imageContainer: {
      height: HERO_IMAGE_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
    },
    image: {
      width: '100%' as const,
      height: '100%' as const,
    },
    statusBadge: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      backgroundColor: colorWithAlpha(statusColor, 0.9),
    },
    statusText: {
      color: theme.colors.surface,
    },
    recentBadge: {
      position: 'absolute',
      bottom: spacing.md,
      right: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      backgroundColor: colorWithAlpha(theme.colors.primary, 0.9),
    },
    recentBadgeText: {
      color: theme.colors.onPrimary,
    },
    content: {
      padding: spacing.base,
      gap: spacing.xs,
    },
    titleText: {
      color: theme.colors.onSurface,
    },
    metaText: {
      color: theme.colors.onSurfaceVariant,
    },
    specs: {
      flexDirection: 'row',
      gap: spacing.base,
      marginTop: spacing.sm,
    },
    specItem: {
      alignItems: 'flex-start',
    },
    specValue: {
      color: theme.colors.onSurface,
    },
    specLabel: {
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: theme.colors.onSurfaceVariant,
    },
  });
}
