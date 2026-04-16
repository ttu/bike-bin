import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { ItemCategory, ItemCondition, ItemStatus, AvailabilityType } from '@/shared/types';
import { createMockItem } from '@/test/factories';
import { ItemGalleryTile } from './ItemGalleryTile';

const meta = {
  title: 'Inventory/ItemGalleryTile',
  component: ItemGalleryTile,
} satisfies Meta<typeof ItemGalleryTile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    item: createMockItem({
      name: 'Rear light',
      category: ItemCategory.Accessory,
      condition: ItemCondition.Good,
      status: ItemStatus.Stored,
      availabilityTypes: [AvailabilityType.Borrowable],
      thumbnailStoragePath: undefined,
    }),
    onPress: fn(),
  },
};
