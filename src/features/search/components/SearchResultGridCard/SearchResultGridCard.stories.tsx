import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { createMockSearchResultItem } from '@/test/factories';
import { SearchResultGridCard } from './SearchResultGridCard';

const meta = {
  title: 'Search/SearchResultGridCard',
  component: SearchResultGridCard,
} satisfies Meta<typeof SearchResultGridCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    item: createMockSearchResultItem(),
    onPress: fn(),
  },
};

export const WithQuantity: Story = {
  args: {
    item: createMockSearchResultItem({ quantity: 3, name: 'Brake pads (set)' }),
    onPress: fn(),
  },
};
