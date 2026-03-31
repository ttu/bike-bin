import { View, ScrollView, Pressable } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { useTranslation } from 'react-i18next';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface BrandModelSectionProps extends InputStyling {
  brand: ItemFormState['brand'];
  brandMenuVisible: ItemFormState['brandMenuVisible'];
  setBrandMenuVisible: ItemFormState['setBrandMenuVisible'];
  filteredBrands: ItemFormState['filteredBrands'];
  model: ItemFormState['model'];
  setModel: ItemFormState['setModel'];
  handleBrandSelect: ItemFormState['handleBrandSelect'];
  handleBrandInputChange: ItemFormState['handleBrandInputChange'];
}

export function BrandModelSection({
  brand,
  brandMenuVisible,
  setBrandMenuVisible,
  filteredBrands,
  model,
  setModel,
  handleBrandSelect,
  handleBrandInputChange,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: BrandModelSectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.brandLabel')}
      </Text>
      <View style={styles.autocompleteWrapper}>
        <TextInput
          mode="flat"
          value={brand}
          onChangeText={handleBrandInputChange}
          onFocus={() => {
            if (brand.length > 0) setBrandMenuVisible(true);
          }}
          onBlur={() => {
            setTimeout(() => setBrandMenuVisible(false), 200);
          }}
          placeholder={t('form.brandPlaceholder')}
          style={softInputStyle}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
        {brandMenuVisible && filteredBrands.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filteredBrands.slice(0, 8).map((b) => (
                <Pressable
                  key={b}
                  onPress={() => handleBrandSelect(b)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text variant="bodyMedium">{b}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

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
