import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { type AppTheme } from '@/shared/theme';
import { DetailCard, detailCardStyles } from '@/shared/components';
import { CONDITION_ICON, CONDITION_ICON_FALLBACK } from '@/shared/constants/conditionIcons';
import type { SearchResultItem } from '../../../types';
import { styles, useThemedStyles } from '../shared';

export function ListingDetailStrip({
  item,
  durationText,
}: {
  readonly item: SearchResultItem;
  readonly durationText: string | undefined;
}) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation(['search']);
  const themed = useThemedStyles();
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View
        style={[
          detailCardStyles.container,
          { backgroundColor: theme.customColors.surfaceContainerLow },
        ]}
      >
        <DetailCard
          icon={CONDITION_ICON[item.condition] ?? CONDITION_ICON_FALLBACK}
          label={t('search:listing.detail.conditionLabel')}
          value={t(`search:condition.${item.condition}`)}
        />
        {item.quantity > 1 && (
          <DetailCard
            icon="package-variant"
            label={t('search:listing.detail.quantityLabel')}
            value={t('search:listing.detail.quantityValue', { count: item.quantity })}
          />
        )}
        {durationText && (
          <DetailCard
            icon="clock-outline"
            label={t('search:listing.detail.durationLabel')}
            value={durationText}
          />
        )}
      </View>
    </View>
  );
}
