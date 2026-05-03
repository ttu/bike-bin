import { HelperText, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { BikeFormState, InputStyling } from '../types';
import { styles } from '../styles';

interface HoursSectionProps {
  readonly state: BikeFormState;
  readonly inputStyling: InputStyling;
}

export function HoursSection({ state, inputStyling }: HoursSectionProps) {
  const { t } = useTranslation('bikes');

  return (
    <>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.hoursLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={state.usageHoursStr}
        onChangeText={state.setUsageHoursStr}
        placeholder={t('form.hoursPlaceholder')}
        keyboardType="decimal-pad"
        error={!!state.errors.usageHours}
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
      {state.errors.usageHours && (
        <HelperText type="error" visible>
          {state.errors.usageHours}
        </HelperText>
      )}
    </>
  );
}
