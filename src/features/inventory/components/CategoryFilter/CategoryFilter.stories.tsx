import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ItemCategory } from '@/shared/types';
import { CategoryFilter } from './CategoryFilter';

const meta = {
  title: 'Inventory/CategoryFilter',
  component: CategoryFilter,
} satisfies Meta<typeof CategoryFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

function CategoryFilterPlayground({
  selected: initialSelected,
  onSelect,
}: {
  selected?: ItemCategory;
  onSelect?: (category: ItemCategory | undefined) => void;
}) {
  const [selected, setSelected] = useState<ItemCategory | undefined>(initialSelected);
  return (
    <CategoryFilter
      selected={selected}
      onSelect={(category) => {
        setSelected(category);
        onSelect?.(category);
      }}
    />
  );
}

export const Interactive: Story = {
  args: {
    selected: undefined,
    onSelect: fn(),
  },
  render: (args) => <CategoryFilterPlayground selected={args.selected} onSelect={args.onSelect} />,
};

export const ComponentsSelected: Story = {
  args: {
    selected: ItemCategory.Component,
    onSelect: fn(),
  },
  render: (args) => <CategoryFilterPlayground selected={args.selected} onSelect={args.onSelect} />,
};
