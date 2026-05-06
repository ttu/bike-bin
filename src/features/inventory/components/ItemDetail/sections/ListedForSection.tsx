import { View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { type AvailabilityType } from '@/shared/types';
import { Stamp } from '@/shared/components/Stamp/Stamp';
import { styles, useThemedStyles } from '../shared';

export function ListedForSection({
  listAvailability,
  ownerGroup,
}: {
  readonly listAvailability: AvailabilityType[];
  readonly ownerGroup: { name: string } | undefined;
}) {
  const { t } = useTranslation('inventory');
  const themed = useThemedStyles();
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
