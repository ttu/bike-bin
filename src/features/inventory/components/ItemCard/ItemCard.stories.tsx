import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Visibility,
} from '@/shared/types';
import { createMockItem } from '@/test/factories';
import { ItemCard } from './ItemCard';

const meta = {
  title: 'Inventory/ItemCard',
  component: ItemCard,
} satisfies Meta<typeof ItemCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleItem = createMockItem({
  name: 'Shimano cassette',
  category: ItemCategory.Component,
  subcategory: 'drivetrain',
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
  visibility: Visibility.Private,
  thumbnailStoragePath: undefined,
});

export const Default: Story = {
  args: {
    item: sampleItem,
    onPress: fn(),
  },
};

export const Compact: Story = {
  args: {
    item: sampleItem,
    compact: true,
    onPress: fn(),
  },
};
