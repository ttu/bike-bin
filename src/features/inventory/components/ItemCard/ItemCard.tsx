import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/shared/types';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { getStatusColor } from '../../utils/status';

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  compact?: boolean;
}

export function ItemCard({ item, onPress, compact = false }: ItemCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  const statusColorToken = getStatusColor(item.status);
  const statusColor =
    statusColorToken === 'warning'
      ? theme.customColors.warning
      : statusColorToken === 'success'
        ? theme.customColors.success
        : theme.colors.outline;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={[styles.thumbnail, { backgroundColor: theme.colors.surfaceVariant }]}>
        {item.thumbnailStoragePath ? (
          <Image
            source={{
              uri: supabase.storage.from('item-photos').getPublicUrl(item.thumbnailStoragePath).data
                .publicUrl,
            }}
            style={styles.thumbnailImage}
            resizeMode="cover"
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
          <View style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
            <Text variant="labelSmall" style={{ color: statusColor }}>
              {t(`status.${item.status}`)}
            </Text>
          </View>
        </View>

        {!compact && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {t(`category.${item.category}`)} · {t(`condition.${item.condition}`)}
          </Text>
        )}

        {!compact && item.availabilityTypes.length > 0 && (
          <View style={styles.chips}>
            {item.availabilityTypes.map((type) => (
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
          </View>
        )}
      </View>
    </Pressable>
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
    width: 80,
    height: 60,
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
  chipText: {
    fontSize: 11,
  },
});
