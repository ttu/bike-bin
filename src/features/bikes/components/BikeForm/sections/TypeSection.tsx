import { View } from 'react-native';
import { Chip, HelperText, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { BikeType } from '@/shared/types';
import type { AppTheme } from '@/shared/theme';
import type { BikeFormState } from '../types';
import { styles } from '../styles';

const BIKE_TYPES: readonly BikeType[] = [
  BikeType.Road,
  BikeType.Gravel,
  BikeType.MTB,
  BikeType.XC,
  BikeType.Enduro,
  BikeType.Downhill,
  BikeType.Cyclo,
  BikeType.City,
  BikeType.Touring,
  BikeType.BMX,
  BikeType.Fatbike,
  BikeType.Other,
];

interface TypeSectionProps {
  readonly state: BikeFormState;
}

export function TypeSection({ state }: TypeSectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');

  return (
    <>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.typeLabel')}
      </Text>
      <View style={styles.chipRow}>
        {BIKE_TYPES.map((type) => {
          const active = state.bikeType === type;
          return (
            <Chip
              key={type}
              selected={active}
              onPress={() => state.setBikeType(type)}
              showSelectedCheck={false}
              textStyle={active ? { color: theme.colors.onPrimary } : undefined}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.secondaryContainer,
                },
              ]}
            >
              {t(`bikeType.${type}`)}
            </Chip>
          );
        })}
      </View>
      {state.errors.type && (
        <HelperText type="error" visible>
          {state.errors.type}
        </HelperText>
      )}
    </>
  );
}
