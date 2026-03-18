import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Chip, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { SavedLocation } from '@/shared/types';
import { spacing, borderRadius, iconSize } from '@/shared/theme';

interface LocationCardProps {
  location: SavedLocation;
  onPress?: (location: SavedLocation) => void;
  onDelete?: (location: SavedLocation) => void;
}

export function LocationCard({ location, onPress, onDelete }: LocationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('locations');

  return (
    <Pressable
      onPress={() => onPress?.(location)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`${location.label}${location.isPrimary ? `, ${t('primaryBadge')}` : ''}`}
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
          <Text
            variant="titleMedium"
            numberOfLines={1}
            style={[styles.label, { color: theme.colors.onSurface }]}
          >
            {location.label}
          </Text>
          {location.isPrimary && (
            <Chip
              compact
              textStyle={styles.badgeText}
              style={[styles.primaryBadge, { backgroundColor: theme.colors.primaryContainer }]}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('primaryBadge')}
              </Text>
            </Chip>
          )}
        </View>

        {location.areaName && (
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {location.areaName}
          </Text>
        )}

        {location.postcode && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {location.postcode}
          </Text>
        )}
      </View>

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

      <MaterialCommunityIcons
        name="chevron-right"
        size={iconSize.md}
        color={theme.colors.onSurfaceVariant}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
