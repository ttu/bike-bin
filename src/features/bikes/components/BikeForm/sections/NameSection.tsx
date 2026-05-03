import { HelperText, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { BikeFormState, InputStyling } from '../types';
import { styles } from '../styles';

interface NameSectionProps {
  readonly state: BikeFormState;
  readonly inputStyling: InputStyling;
}

export function NameSection({ state, inputStyling }: NameSectionProps) {
  const { t } = useTranslation('bikes');

  return (
    <>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.nameLabel')}
      </Text>
      <TextInput
        testID="bike-form-name-input"
        mode="flat"
        value={state.nameFieldValue}
        onChangeText={state.setName}
        placeholder={t('form.namePlaceholder')}
        error={!!state.errors.name}
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
      {state.errors.name && (
        <HelperText type="error" visible>
          {state.errors.name}
        </HelperText>
      )}
    </>
  );
}
