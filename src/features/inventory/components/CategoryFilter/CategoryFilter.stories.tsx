import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { ItemCategory } from '@/shared/types';
import { CategoryFilter } from './CategoryFilter';

const meta = {
  title: 'Inventory/CategoryFilter',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function CategoryFilterPlayground() {
  const [selected, setSelected] = useState<ItemCategory | undefined>(undefined);
  return <CategoryFilter selected={selected} onSelect={setSelected} />;
}

export const Interactive: Story = {
  render: () => <CategoryFilterPlayground />,
};

export const ComponentsSelected: Story = {
  render: function ComponentsSelectedStory() {
    const [selected, setSelected] = useState<ItemCategory | undefined>(ItemCategory.Component);
    return <CategoryFilter selected={selected} onSelect={setSelected} />;
  },
};
