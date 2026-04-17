import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Visibility,
  type ItemId,
  type UserId,
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
  id: 'story-item-1' as ItemId,
  ownerId: 'story-owner-1' as UserId,
  name: 'Shimano cassette',
  category: ItemCategory.Component,
  subcategory: 'drivetrain',
  brand: 'Shimano',
  model: 'CS-5800',
  description: '11-speed cassette for Storybook.',
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
  visibility: Visibility.Private,
  thumbnailStoragePath: undefined,
  price: undefined,
  deposit: undefined,
  borrowDuration: undefined,
  storageLocation: undefined,
  age: undefined,
  usageKm: undefined,
  pickupLocationId: undefined,
  purchaseDate: undefined,
  mountedDate: undefined,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  tags: [],
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
