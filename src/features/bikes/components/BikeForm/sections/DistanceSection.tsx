import { HelperText, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { BikeFormState, InputStyling } from '../types';
import { styles } from '../styles';

interface DistanceSectionProps {
  readonly state: BikeFormState;
  readonly inputStyling: InputStyling;
}

export function DistanceSection({ state, inputStyling }: DistanceSectionProps) {
  const { t } = useTranslation('bikes');

  return (
    <>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.distanceLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={state.distanceKmStr}
        onChangeText={state.setDistanceKmStr}
        placeholder={t('form.distancePlaceholder')}
        keyboardType="decimal-pad"
        error={!!state.errors.distanceKm}
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
      {state.errors.distanceKm && (
        <HelperText type="error" visible>
          {state.errors.distanceKm}
        </HelperText>
      )}
    </>
  );
}
