import { Text, TextInput, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface QuantitySectionProps extends InputStyling {
  quantityStr: ItemFormState['quantityStr'];
  setQuantityStr: ItemFormState['setQuantityStr'];
  errors: ItemFormState['errors'];
}

export function QuantitySection({
  quantityStr,
  setQuantityStr,
  errors,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: QuantitySectionProps) {
  const { t } = useTranslation('inventory');

  return (
    <>
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
