import type { Meta, StoryObj } from '@storybook/react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { borderRadius, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { BrandAutocompleteInput } from './BrandAutocompleteInput';

const BRANDS = ['Shimano', 'SRAM', 'Campagnolo', 'Canyon'];

const meta = {
  title: 'Shared/BrandAutocompleteInput',
  component: BrandAutocompleteInput,
} satisfies Meta<typeof BrandAutocompleteInput>;

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
      underlineColor={colorWithAlpha(theme.colors.outlineVariant, 0x26 / 255)}
      activeUnderlineColor={theme.colors.primary}
    />
  );
}

/** Playground owns state; args are placeholders so Storybook types stay satisfied. */
export const WithSuggestions = {
  args: {} as never,
  render: () => <BrandAutocompletePlayground />,
} as unknown as Story;
