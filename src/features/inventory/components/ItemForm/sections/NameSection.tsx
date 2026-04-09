import { Text, TextInput, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface NameSectionProps extends InputStyling {
  nameFieldValue: ItemFormState['nameFieldValue'];
  setName: ItemFormState['setName'];
  errors: ItemFormState['errors'];
}

export function NameSection({
  nameFieldValue,
  setName,
  errors,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: NameSectionProps) {
  const { t } = useTranslation('inventory');

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
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.name && (
        <HelperText type="error" visible>
          {errors.name}
        </HelperText>
      )}
    </>
  );
}
