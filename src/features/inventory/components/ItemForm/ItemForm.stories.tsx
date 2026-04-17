import type { Meta, StoryObj } from '@storybook/react-native';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { AvailabilityType, ItemCategory, ItemCondition } from '@/shared/types';
import { ItemForm } from './ItemForm';

const meta = {
  title: 'Inventory/ItemForm',
  component: ItemForm,
} satisfies Meta<typeof ItemForm>;

export default meta;

type Story = StoryObj<typeof meta>;

function NewItemStory(args: ComponentProps<typeof ItemForm>) {
  const { t } = useTranslation('storybook');
  const base = args.initialData;
  if (!base) {
    throw new Error('ItemForm story requires initialData');
  }
  return (
    <ItemForm
      {...args}
      initialData={{
        ...base,
        name: t('fixtures.itemFormSampleName'),
        availabilityTypes: base.availabilityTypes ?? [AvailabilityType.Borrowable],
      }}
    />
  );
}

export const NewItem: Story = {
  args: {
    initialData: {
      name: '',
      category: ItemCategory.Component,
      condition: ItemCondition.Good,
      availabilityTypes: [AvailabilityType.Borrowable],
      quantity: 1,
    },
    onSave: fn(),
    isSubmitting: false,
  },
  render: (args) => <NewItemStory {...args} />,
};
