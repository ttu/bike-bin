import { useTranslation } from 'react-i18next';
import { BrandAutocompleteInput } from '@/shared/components/BrandAutocompleteInput';
import type { BikeFormState, InputStyling } from '../types';
import { styles } from '../styles';

interface BrandSectionProps {
  readonly state: BikeFormState;
  readonly inputStyling: InputStyling;
}

export function BrandSection({ state, inputStyling }: BrandSectionProps) {
  const { t } = useTranslation('bikes');
  const nameIsEmpty = state.name.trim().length === 0;
  const placeholder = nameIsEmpty
    ? t('form.brandPlaceholderWhenNameEmpty')
    : t('form.brandPlaceholder');

  return (
    <BrandAutocompleteInput
      label={t('form.brandLabel')}
      labelStyle={styles.label}
      placeholder={placeholder}
      value={state.brand}
      filteredBrands={state.filteredBrands}
      menuVisible={state.brandMenuVisible}
      onChangeText={state.handleBrandInputChange}
      onSelectBrand={state.handleBrandSelect}
      onFocus={state.handleBrandFocus}
      onBlur={state.handleBrandBlur}
      onSuggestionPressIn={state.cancelBrandBlurTimeout}
      softInputStyle={inputStyling.softInputStyle}
      underlineColor={inputStyling.underlineColor}
      activeUnderlineColor={inputStyling.activeUnderlineColor}
    />
  );
}
