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

function CategoryFilterPlayground() {
  const [selected, setSelected] = useState<ItemCategory | undefined>(undefined);
  return <CategoryFilter selected={selected} onSelect={setSelected} />;
}

export const Interactive: Story = {
  args: {
    selected: undefined,
    onSelect: fn(),
  },
  render: () => <CategoryFilterPlayground />,
};

export const ComponentsSelected: Story = {
  args: {
    selected: ItemCategory.Component,
    onSelect: fn(),
  },
  render: function ComponentsSelectedStory() {
    const [selected, setSelected] = useState<ItemCategory | undefined>(ItemCategory.Component);
    return <CategoryFilter selected={selected} onSelect={setSelected} />;
  },
};
