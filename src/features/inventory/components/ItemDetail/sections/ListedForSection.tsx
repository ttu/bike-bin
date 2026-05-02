import { View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { type AvailabilityType } from '@/shared/types';
import { Stamp } from '@/shared/components/Stamp/Stamp';
import { styles, type Themed, type TFn } from '../shared';

export function ListedForSection({
  listAvailability,
  ownerGroup,
  themed,
  t,
}: {
  readonly listAvailability: AvailabilityType[];
  readonly ownerGroup: { name: string } | null | undefined;
  readonly themed: Themed;
  readonly t: TFn;
}) {
  if (listAvailability.length === 0 && !ownerGroup) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.stampHeader}>
        <Stamp tone="dim">{t('detail.listedFor')}</Stamp>
      </View>
      <View style={styles.chipRow}>
        {listAvailability.map((type) => (
          <Chip key={type} compact style={[styles.listingChip, themed.accentChipBg]}>
            <Text variant="labelSmall" style={themed.accentChipText}>
              {t(`availability.${type}`)}
            </Text>
          </Chip>
        ))}
        {ownerGroup && (
          <Chip compact icon="account-group" style={[styles.listingChip, themed.accentChipBg]}>
            <Text variant="labelSmall" style={themed.accentChipText}>
              {ownerGroup.name}
            </Text>
          </Chip>
        )}
      </View>
    </View>
  );
}
