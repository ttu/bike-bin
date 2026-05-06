import { View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { SearchResultItem } from '../../../types';
import { MIDDLE_DOT, styles, useThemedStyles } from '../shared';

export function ListingTitleBlock({
  item,
  categoryLabel,
  metaParts,
}: {
  readonly item: SearchResultItem;
  readonly categoryLabel: string;
  readonly metaParts: string[];
}) {
  const { t } = useTranslation(['search']);
  const themed = useThemedStyles();
  return (
    <View style={[styles.section, styles.sectionFirst, themed.sectionBorder]}>
      <View style={styles.chipRow}>
        <Chip compact style={[styles.titleChip, themed.titleChipSurface]}>
          <Text variant="labelSmall" style={themed.onSurfaceVariant}>
            {categoryLabel}
          </Text>
        </Chip>
        {item.quantity > 1 && (
          <Chip compact style={[styles.titleChip, themed.titleChipSurface]}>
            <Text variant="labelSmall" style={themed.onSurfaceVariant}>
              {t('search:listing.detail.quantityChip', { count: item.quantity })}
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
