import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ItemCategory, type DistanceUnit, type Item } from '@/shared/types';
import { DisplayFigure } from '@/shared/components/DisplayFigure';
import { kmToDisplayUnit } from '@/shared/utils/distanceConversion';
import { styles, useThemedStyles } from '../shared';

export function FigureStrip({
  item,
  distanceUnit,
}: {
  readonly item: Item;
  readonly distanceUnit: DistanceUnit;
}) {
  const { t } = useTranslation('inventory');
  const themed = useThemedStyles();
  const showRemaining =
    item.category === ItemCategory.Consumable && item.remainingFraction !== undefined;
  const showQuantity = item.quantity > 1;
  const showUsage = item.usageKm !== undefined;
  if (!showRemaining && !showQuantity && !showUsage) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.figureStrip}>
        {showRemaining && item.remainingFraction !== undefined && (
          <DisplayFigure
            value={String(Math.round(item.remainingFraction * 100))}
            unit="%"
            note={t('detail.remainingLabel')}
            size={28}
          />
        )}
        {showQuantity && (
          <DisplayFigure value={String(item.quantity)} note={t('detail.quantityLabel')} size={28} />
        )}
        {showUsage && item.usageKm !== undefined && (
          <DisplayFigure
            value={String(kmToDisplayUnit(item.usageKm, distanceUnit))}
            unit={distanceUnit}
            note={t('detail.usageLabel')}
            size={28}
          />
        )}
      </View>
    </View>
  );
}
