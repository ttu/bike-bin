import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Searchbar, useTheme, Menu } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { DISTANCE_PRESETS } from '../../types';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  areaName?: string;
  distanceKm: number;
  onDistanceChange: (km: number) => void;
  onChangeLocation?: () => void;
}

export function SearchBar({
  query,
  onQueryChange,
  onSubmit,
  areaName,
  distanceKm,
  onDistanceChange,
  onChangeLocation,
}: SearchBarProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const [distanceMenuVisible, setDistanceMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchPlaceholder')}
        value={query}
        onChangeText={onQueryChange}
        onSubmitEditing={onSubmit}
        style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
        inputStyle={{ color: theme.colors.onSurface }}
        accessibilityLabel={t('searchPlaceholder')}
      />

      <View style={styles.locationRow}>
        <View style={styles.locationLeft}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          {areaName ? (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              {areaName}
            </Text>
          ) : null}
          {onChangeLocation ? (
            <Pressable onPress={onChangeLocation} accessibilityRole="button">
              <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                {t('changeLocation')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Menu
          visible={distanceMenuVisible}
          onDismiss={() => setDistanceMenuVisible(false)}
          anchor={
            <Pressable
              onPress={() => setDistanceMenuVisible(true)}
              style={styles.distanceButton}
              accessibilityRole="button"
              accessibilityLabel={t('locationLine', { distance: distanceKm })}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('locationLine', { distance: distanceKm })}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          }
        >
          {DISTANCE_PRESETS.map((km) => (
            <Menu.Item
              key={km}
              title={t('distance.km', { distance: km })}
              onPress={() => {
                onDistanceChange(km);
                setDistanceMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  searchbar: {
    borderRadius: borderRadius.sm,
    elevation: 0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  distanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
