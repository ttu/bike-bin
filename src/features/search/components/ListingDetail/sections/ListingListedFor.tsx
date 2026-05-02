import { View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { AvailabilityType } from '@/shared/types';
import { type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { Stamp } from '@/shared/components/Stamp/Stamp';
import type { SearchResultItem } from '../../../types';
import { MIDDLE_DOT, styles, type Themed, type TFn } from '../shared';

const formatPrice = (price: number): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);

export function ListingListedFor({
  listAvailability,
  item,
  theme,
  themed,
  t,
}: {
  readonly listAvailability: AvailabilityType[];
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly t: TFn;
}) {
  if (listAvailability.length === 0) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.stampHeader}>
        <Stamp tone="dim">{t('search:listing.listedFor')}</Stamp>
      </View>
      <View style={styles.chipRow}>
        {listAvailability.map((type) => {
          const label = t(`search:availability.${type}`);
          const suffix =
            type === AvailabilityType.Sellable && item.price !== undefined
              ? `${MIDDLE_DOT}${formatPrice(item.price)}`
              : '';
          return (
            <Chip
              key={type}
              compact
              style={[
                styles.listingChip,
                { backgroundColor: colorWithAlpha(theme.customColors.accent, 0.12) },
              ]}
            >
              <Text variant="labelSmall" style={themed.accentChipText}>
                {`${label}${suffix}`}
              </Text>
            </Chip>
          );
        })}
      </View>
    </View>
  );
}
