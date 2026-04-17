import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { AvailabilityType, ItemCategory, ItemCondition } from '@/shared/types';
import { DEFAULT_SEARCH_FILTERS, type SearchFilters } from '../../types';
import { FilterSheet } from './FilterSheet';

const meta = {
  title: 'Search/FilterSheet',
  component: FilterSheet,
} satisfies Meta<typeof FilterSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function FilterSheetPlayground({
  initialFilters,
  onFiltersChange: onFiltersChangeArg,
  onReset: onResetArg,
  onApply: onApplyArg,
}: {
  initialFilters: SearchFilters;
  onFiltersChange?: (partial: Partial<SearchFilters>) => void;
  onReset?: () => void;
  onApply?: () => void;
}) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  return (
    <FilterSheet
      filters={filters}
      onFiltersChange={(partial) => {
        setFilters((prev) => ({ ...prev, ...partial }));
        onFiltersChangeArg?.(partial);
      }}
      onReset={() => {
        setFilters(DEFAULT_SEARCH_FILTERS);
        onResetArg?.();
      }}
      onApply={() => {
        onApplyArg?.();
      }}
    />
  );
}

export const Interactive: Story = {
  args: {
    filters: DEFAULT_SEARCH_FILTERS,
    onFiltersChange: fn(),
    onReset: fn(),
    onApply: fn(),
  },
  render: (args) => (
    <FilterSheetPlayground
      initialFilters={args.filters ?? DEFAULT_SEARCH_FILTERS}
      onFiltersChange={args.onFiltersChange}
      onReset={args.onReset}
      onApply={args.onApply}
    />
  ),
};

const withSellFiltersState: SearchFilters = {
  ...DEFAULT_SEARCH_FILTERS,
  offerTypes: [AvailabilityType.Sellable],
  categories: [ItemCategory.Component],
  conditions: [ItemCondition.Good, ItemCondition.New],
  priceMin: 10,
  priceMax: 200,
};

export const WithSellFilters: Story = {
  args: {
    filters: withSellFiltersState,
    onFiltersChange: fn(),
    onReset: fn(),
    onApply: fn(),
  },
  render: (args) => (
    <FilterSheetPlayground
      initialFilters={args.filters ?? withSellFiltersState}
      onFiltersChange={args.onFiltersChange}
      onReset={args.onReset}
      onApply={args.onApply}
    />
  ),
};
