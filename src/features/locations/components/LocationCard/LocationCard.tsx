import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { SavedLocation } from '@/shared/types';
import { spacing, borderRadius, iconSize } from '@/shared/theme';

interface LocationCardProps {
  readonly location: SavedLocation;
  readonly onPress?: (location: SavedLocation) => void;
  readonly onDelete?: (location: SavedLocation) => void;
}

export function LocationCard({ location, onPress, onDelete }: LocationCardProps) {
  const theme = useTheme();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        container: { backgroundColor: theme.colors.surface },
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primaryBadge: { backgroundColor: theme.colors.primaryContainer },
        primaryBadgeText: { color: theme.colors.onPrimaryContainer },
      }),
    [theme],
  );
  const { t } = useTranslation('locations');

  const primaryBadgeSuffix = location.isPrimary ? `, ${t('primaryBadge')}` : '';
  const cardAccessibilityLabel = `${location.label}${primaryBadgeSuffix}`;

  const handleCardPress = () => onPress?.(location);

  return (
    <View style={[styles.container, themed.container]}>
      <Pressable
        onPress={handleCardPress}
        style={styles.mainPressable}
        accessibilityRole="button"
        accessibilityLabel={cardAccessibilityLabel}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="map-marker"
            size={iconSize.lg}
            color={location.isPrimary ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="titleMedium" numberOfLines={1} style={[styles.label, themed.onSurface]}>
              {location.label}
            </Text>
            {location.isPrimary && (
              <View style={[styles.primaryBadge, themed.primaryBadge]}>
                <Text variant="labelSmall" style={[styles.badgeText, themed.primaryBadgeText]}>
                  {t('primaryBadge')}
                </Text>
              </View>
            )}
          </View>

          {location.areaName && (
            <Text variant="bodyMedium" numberOfLines={1} style={themed.onSurfaceVariant}>
              {location.areaName}
            </Text>
          )}

          {location.postcode && (
            <Text variant="bodySmall" style={themed.onSurfaceVariant}>
              {location.postcode}
            </Text>
          )}
        </View>
      </Pressable>

      {onDelete && !location.isPrimary && (
        <Pressable
          onPress={() => onDelete(location)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel={t('delete.title')}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="close"
            size={iconSize.sm}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      )}

      <Pressable
        onPress={handleCardPress}
        style={styles.chevronPressable}
        tabIndex={-1}
        hitSlop={8}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  chevronPressable: {
    justifyContent: 'center' as const,
    alignSelf: 'stretch' as const,
    paddingLeft: spacing.xs,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
  primaryBadge: {
    height: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  badgeText: {},
  deleteButton: {
    padding: spacing.sm,
  },
});
