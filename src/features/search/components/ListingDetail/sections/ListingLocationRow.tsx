import { View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type AppTheme } from '@/shared/theme';
import type { SearchResultItem } from '../../../types';
import { styles, type Themed } from '../shared';

export function ListingLocationRow({
  hasLocation,
  item,
  theme,
  themed,
  distanceText,
}: {
  readonly hasLocation: boolean;
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly distanceText: string | undefined;
}) {
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
