import { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { Bike } from '@/shared/types';
import { CachedListThumbnail } from '@/shared/components/CachedListThumbnail';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

interface BikeCardProps {
  bike: Bike;
  onPress?: (bike: Bike) => void;
}

export const BikeCard = memo(function BikeCard({ bike, onPress }: BikeCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');

  return (
    <Pressable
      onPress={() => onPress?.(bike)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={bike.name}
    >
      <View style={[styles.thumbnail, { backgroundColor: theme.colors.surfaceVariant }]}>
        {bike.thumbnailStoragePath ? (
          <CachedListThumbnail
            uri={
              supabase.storage.from('item-photos').getPublicUrl(bike.thumbnailStoragePath).data
                .publicUrl
            }
            cacheKey={bike.thumbnailStoragePath}
            style={styles.thumbnailImage}
          />
        ) : (
          <MaterialCommunityIcons
            name="bicycle"
            size={iconSize.lg}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </View>

      <View style={styles.content}>
        <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
          {bike.name}
        </Text>

        <View style={styles.meta}>
          <View style={[styles.typeChip, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text
              variant="labelSmall"
              style={[styles.chipText, { color: theme.colors.onSurfaceVariant }]}
            >
              {t(`bikeType.${bike.type}`)}
            </Text>
          </View>
          {bike.brand && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              {bike.brand}
              {bike.year ? ` · ${bike.year}` : ''}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
});

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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  typeChip: {
    height: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  chipText: {},
});
