import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { BrandAutocompleteInput } from '@/shared/components/BrandAutocompleteInput';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface BrandModelSectionProps extends InputStyling {
  brand: ItemFormState['brand'];
  brandMenuVisible: ItemFormState['brandMenuVisible'];
  handleBrandFocus: ItemFormState['handleBrandFocus'];
  handleBrandBlur: ItemFormState['handleBrandBlur'];
  cancelBrandBlurTimeout: ItemFormState['cancelBrandBlurTimeout'];
  filteredBrands: ItemFormState['filteredBrands'];
  model: ItemFormState['model'];
  setModel: ItemFormState['setModel'];
  handleBrandSelect: ItemFormState['handleBrandSelect'];
  handleBrandInputChange: ItemFormState['handleBrandInputChange'];
}

export function BrandModelSection({
  brand,
  brandMenuVisible,
  handleBrandFocus,
  handleBrandBlur,
  cancelBrandBlurTimeout,
  filteredBrands,
  model,
  setModel,
  handleBrandSelect,
  handleBrandInputChange,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: BrandModelSectionProps) {
  const { t } = useTranslation('inventory');

  return (
    <>
      <BrandAutocompleteInput
        label={t('form.brandLabel')}
        labelStyle={[styles.label, styles.sectionLabel]}
        placeholder={t('form.brandPlaceholder')}
        value={brand}
        filteredBrands={filteredBrands}
        menuVisible={brandMenuVisible}
        onChangeText={handleBrandInputChange}
        onSelectBrand={handleBrandSelect}
        onFocus={handleBrandFocus}
        onBlur={handleBrandBlur}
        onSuggestionPressIn={cancelBrandBlurTimeout}
        softInputStyle={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.modelLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={model}
        onChangeText={setModel}
        placeholder={t('form.modelPlaceholder')}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
    </>
  );
}
