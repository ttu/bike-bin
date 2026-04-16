import type { Meta, StoryObj } from '@storybook/react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { BrandAutocompleteInput } from './BrandAutocompleteInput';

const BRANDS = ['Shimano', 'SRAM', 'Campagnolo', 'Canyon'];

const meta = {
  title: 'Shared/BrandAutocompleteInput',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function BrandAutocompletePlayground() {
  const { t } = useTranslation('storybook');
  const theme = useTheme<AppTheme>();
  const [value, setValue] = useState('Shi');
  const [menuVisible, setMenuVisible] = useState(true);

  const filteredBrands = useMemo(
    () => BRANDS.filter((b) => b.toLowerCase().includes(value.toLowerCase())),
    [value],
  );

  const softInputStyle = {
    backgroundColor: theme.customColors.surfaceContainerHighest,
    borderRadius: borderRadius.md,
  };

  return (
    <BrandAutocompleteInput
      label={t('brandInput.label')}
      placeholder={t('brandInput.placeholder')}
      value={value}
      filteredBrands={filteredBrands}
      menuVisible={menuVisible}
      onChangeText={(text) => {
        setValue(text);
        setMenuVisible(true);
      }}
      onSelectBrand={(brand) => {
        setValue(brand);
        setMenuVisible(false);
      }}
      onFocus={() => setMenuVisible(true)}
      onBlur={() => setMenuVisible(false)}
      softInputStyle={softInputStyle}
      underlineColor={theme.colors.outlineVariant + '26'}
      activeUnderlineColor={theme.colors.primary}
    />
  );
}

export const WithSuggestions: Story = {
  render: () => <BrandAutocompletePlayground />,
};
