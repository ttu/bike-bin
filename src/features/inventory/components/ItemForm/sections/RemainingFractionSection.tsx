import { View } from 'react-native';
import { Text, TextInput, HelperText, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { useTranslation } from 'react-i18next';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface RemainingFractionSectionProps {
  readonly state: ItemFormState;
  readonly inputStyling: InputStyling;
}

export function RemainingFractionSection({ state, inputStyling }: RemainingFractionSectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const { remainingPercentStr, setRemainingPercentStr, errors } = state;

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.remainingLabel')}
      </Text>
      <View style={styles.usageRow}>
        <TextInput
          mode="flat"
          value={remainingPercentStr}
          onChangeText={setRemainingPercentStr}
          placeholder={t('form.remainingPlaceholder')}
          keyboardType="number-pad"
          error={!!errors.remainingFraction}
          style={[inputStyling.softInputStyle, styles.usageInput]}
          underlineColor={inputStyling.underlineColor}
          activeUnderlineColor={inputStyling.activeUnderlineColor}
        />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('form.remainingPercentSuffix')}
        </Text>
      </View>
      {errors.remainingFraction && (
        <HelperText type="error" visible>
          {errors.remainingFraction}
        </HelperText>
      )}
    </>
  );
}
