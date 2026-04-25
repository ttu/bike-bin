import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import { ItemCategory } from '@/shared/types';
import { CategoryFilter } from './CategoryFilter';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'category.all': 'All',
        'category.component': 'Components',
        'category.tool': 'Tools',
        'category.accessory': 'Accessories',
        'category.consumable': 'Consumables',
        'category.clothing': 'Clothing',
      };
      return labels[key] ?? key;
    },
  }),
}));

function renderWithPaper(ui: React.ReactElement) {
  return render(<PaperProvider theme={lightTheme}>{ui}</PaperProvider>);
}

describe('CategoryFilter', () => {
  it('clears the category when the active chip is pressed again', () => {
    const onSelect = jest.fn();
    const { getByText } = renderWithPaper(
      <CategoryFilter selected={ItemCategory.Component} onSelect={onSelect} />,
    );

    fireEvent.press(getByText('Components'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it('selects a category when an inactive chip is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = renderWithPaper(
      <CategoryFilter selected={undefined} onSelect={onSelect} />,
    );

    fireEvent.press(getByText('Tools'));
    expect(onSelect).toHaveBeenCalledWith(ItemCategory.Tool);
  });
});
