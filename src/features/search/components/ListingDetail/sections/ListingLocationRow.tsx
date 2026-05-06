import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type AppTheme } from '@/shared/theme';
import type { SearchResultItem } from '../../../types';
import { styles, useThemedStyles } from '../shared';

export function ListingLocationRow({
  hasLocation,
  item,
  distanceText,
}: {
  readonly hasLocation: boolean;
  readonly item: SearchResultItem;
  readonly distanceText: string | undefined;
}) {
  const theme = useTheme<AppTheme>();
  const themed = useThemedStyles();
  if (!hasLocation) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]} testID="location-row">
      <View
        style={[styles.locationBlock, { backgroundColor: theme.customColors.surfaceContainerLow }]}
      >
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={20}
          color={theme.colors.tertiary}
          style={styles.locationIcon}
        />
        <View style={styles.locationText}>
          {item.areaName && (
            <Text variant="titleSmall" style={themed.onBackground}>
              {item.areaName}
            </Text>
          )}
          {distanceText && (
            <Text variant="bodyMedium" style={themed.onSurfaceVariant}>
              {distanceText}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
