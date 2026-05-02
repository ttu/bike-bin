import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { type Item } from '@/shared/types';
import { type AppTheme } from '@/shared/theme';
import { Stamp } from '@/shared/components/Stamp/Stamp';
import { styles, type Themed, type TFn } from '../shared';

export function ServiceRecord({
  item,
  themed,
  theme,
  t,
}: {
  readonly item: Item;
  readonly themed: Themed;
  readonly theme: AppTheme;
  readonly t: TFn;
}) {
  const serviceRows: { label: string; value: string }[] = [
    { label: t('detail.conditionLabel'), value: t(`condition.${item.condition}`) },
  ];
  if (item.mountedDate) {
    serviceRows.push({ label: t('detail.mountedOnLabel'), value: item.mountedDate });
  }
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.stampHeader}>
        <Stamp tone="dim">{t('detail.serviceRecord')}</Stamp>
      </View>
      <View style={styles.specsTable}>
        {serviceRows.map((row, index) => (
          <ServiceRow
            key={row.label}
            label={row.label}
            value={row.value}
            theme={theme}
            isLast={index === serviceRows.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function ServiceRow({
  label,
  value,
  theme,
  isLast = false,
}: Readonly<{
  label: string;
  value: string;
  theme: AppTheme;
  isLast?: boolean;
}>) {
  return (
    <View
      style={[
        styles.serviceRow,
        { borderBottomColor: theme.colors.outlineVariant },
        isLast && styles.serviceRowLast,
      ]}
    >
      <Text
        variant="bodyMedium"
        style={[styles.serviceLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.serviceValue, { color: theme.colors.onBackground }]}
      >
        {value}
      </Text>
    </View>
  );
}
