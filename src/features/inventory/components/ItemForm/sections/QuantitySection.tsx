import { Text, TextInput, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface QuantitySectionProps {
  readonly state: ItemFormState;
  readonly inputStyling: InputStyling;
}

export function QuantitySection({ state, inputStyling }: QuantitySectionProps) {
  const { t } = useTranslation('inventory');
  const { quantityStr, setQuantityStr, errors } = state;

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
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
      {errors.quantity && (
        <HelperText type="error" visible>
          <Text variant="bodySmall">{errors.quantity}</Text>
        </HelperText>
      )}
    </>
  );
}
