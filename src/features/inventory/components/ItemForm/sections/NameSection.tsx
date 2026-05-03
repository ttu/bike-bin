import { Text, TextInput, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface NameSectionProps {
  readonly state: ItemFormState;
  readonly inputStyling: InputStyling;
}

export function NameSection({ state, inputStyling }: NameSectionProps) {
  const { t } = useTranslation('inventory');
  const { nameFieldValue, setName, errors } = state;

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.nameLabel')}
      </Text>
      <TextInput
        mode="flat"
        testID="item-form-name-input"
        value={nameFieldValue}
        onChangeText={setName}
        placeholder={t('form.namePlaceholder')}
        error={!!errors.name}
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
      {errors.name && (
        <HelperText type="error" visible>
          {errors.name}
        </HelperText>
      )}
    </>
  );
}
