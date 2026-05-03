import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { BikeFormState, InputStyling } from '../types';
import { styles } from '../styles';

interface YearSectionProps {
  readonly state: BikeFormState;
  readonly inputStyling: InputStyling;
}

export function YearSection({ state, inputStyling }: YearSectionProps) {
  const { t } = useTranslation('bikes');

  return (
    <>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.yearLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={state.year}
        onChangeText={state.setYear}
        placeholder={t('form.yearPlaceholder')}
        keyboardType="numeric"
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
    </>
  );
}
