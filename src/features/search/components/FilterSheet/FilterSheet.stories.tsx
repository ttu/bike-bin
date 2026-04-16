import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { AvailabilityType, ItemCategory, ItemCondition } from '@/shared/types';
import { DEFAULT_SEARCH_FILTERS, type SearchFilters } from '../../types';
import { FilterSheet } from './FilterSheet';

const meta = {
  title: 'Search/FilterSheet',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function FilterSheetPlayground() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);

  return (
    <FilterSheet
      filters={filters}
      onFiltersChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
      onReset={() => setFilters(DEFAULT_SEARCH_FILTERS)}
      onApply={fn()}
    />
  );
}

export const Interactive: Story = {
  render: () => <FilterSheetPlayground />,
};

export const WithSellFilters: Story = {
  render: function WithSellFiltersStory() {
    const [filters, setFilters] = useState<SearchFilters>({
      ...DEFAULT_SEARCH_FILTERS,
      offerTypes: [AvailabilityType.Sellable],
      categories: [ItemCategory.Component],
      conditions: [ItemCondition.Good, ItemCondition.New],
      priceMin: 10,
      priceMax: 200,
    });

    return (
      <FilterSheet
        filters={filters}
        onFiltersChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
        onReset={() => setFilters(DEFAULT_SEARCH_FILTERS)}
        onApply={fn()}
      />
    );
  },
};
