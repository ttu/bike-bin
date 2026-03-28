import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
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

  const cardAccessibilityLabel = `${location.label}${location.isPrimary ? `, ${t('primaryBadge')}` : ''}`;

  const handleCardPress = () => onPress?.(location);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
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
            <Text
              variant="titleMedium"
              numberOfLines={1}
              style={[styles.label, { color: theme.colors.onSurface }]}
            >
              {location.label}
            </Text>
            {location.isPrimary && (
              <View
                style={[styles.primaryBadge, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Text
                  variant="labelSmall"
                  style={[styles.badgeText, { color: theme.colors.onPrimaryContainer }]}
                >
                  {t('primaryBadge')}
                </Text>
              </View>
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
  badgeText: {
    fontSize: 11,
  },
  deleteButton: {
    padding: spacing.sm,
  },
});
