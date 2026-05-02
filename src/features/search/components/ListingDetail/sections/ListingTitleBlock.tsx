import { View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { type AppTheme } from '@/shared/theme';
import type { SearchResultItem } from '../../../types';
import { MIDDLE_DOT, styles, type Themed } from '../shared';

export function ListingTitleBlock({
  item,
  theme,
  themed,
  categoryLabel,
  metaParts,
}: {
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly categoryLabel: string;
  readonly metaParts: string[];
}) {
  return (
    <View style={[styles.section, styles.sectionFirst, themed.sectionBorder]}>
      <View style={styles.chipRow}>
        <Chip
          compact
          style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
        >
          <Text variant="labelSmall" style={themed.onSurfaceVariant}>
            {categoryLabel}
          </Text>
        </Chip>
        {item.quantity > 1 && (
          <Chip
            compact
            style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
          >
            <Text variant="labelSmall" style={themed.onSurfaceVariant}>
              {`×${item.quantity}`}
            </Text>
          </Chip>
        )}
      </View>
      <Text
        variant="displayLarge"
        style={[styles.title, themed.onBackground]}
        accessibilityRole="header"
      >
        {item.name}
      </Text>
      {metaParts.length > 0 && (
        <Text variant="bodyMedium" style={[styles.metaRow, themed.onSurfaceVariant]}>
          {metaParts.join(MIDDLE_DOT)}
        </Text>
      )}
    </View>
  );
}
