import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { AvailabilityType, ItemCategory, ItemCondition } from '@/shared/types';
import { ItemForm } from './ItemForm';

const meta = {
  title: 'Inventory/ItemForm',
  component: ItemForm,
} satisfies Meta<typeof ItemForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NewItem: Story = {
  args: {
    initialData: {
      name: 'Sample crankset',
      category: ItemCategory.Component,
      condition: ItemCondition.Good,
      availabilityTypes: [AvailabilityType.Borrowable],
      quantity: 1,
    },
    onSave: fn(),
    isSubmitting: false,
  },
};
