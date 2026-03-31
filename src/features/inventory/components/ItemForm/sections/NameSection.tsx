import { Text, TextInput, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface NameSectionProps extends InputStyling {
  name: ItemFormState['name'];
  setName: ItemFormState['setName'];
  quantityStr: ItemFormState['quantityStr'];
  setQuantityStr: ItemFormState['setQuantityStr'];
  errors: ItemFormState['errors'];
}

export function NameSection({
  name,
  setName,
  quantityStr,
  setQuantityStr,
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
        value={name}
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

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.quantityLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={quantityStr}
        onChangeText={setQuantityStr}
        placeholder={t('form.quantityPlaceholder')}
        keyboardType="number-pad"
        error={!!errors.quantity}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.quantity && (
        <HelperText type="error" visible>
          {errors.quantity}
        </HelperText>
      )}
    </>
  );
}
