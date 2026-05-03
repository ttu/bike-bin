import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { BikeFormState, InputStyling } from '../types';
import { styles } from '../styles';

interface ModelSectionProps {
  readonly state: BikeFormState;
  readonly inputStyling: InputStyling;
}

export function ModelSection({ state, inputStyling }: ModelSectionProps) {
  const { t } = useTranslation('bikes');
  const nameIsEmpty = state.name.trim().length === 0;
  const placeholder = nameIsEmpty
    ? t('form.modelPlaceholderWhenNameEmpty')
    : t('form.modelPlaceholder');

  return (
    <>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.modelLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={state.model}
        onChangeText={state.setModel}
        placeholder={placeholder}
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
    </>
  );
}
