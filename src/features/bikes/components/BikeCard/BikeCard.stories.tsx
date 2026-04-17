import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { createMockBike } from '@/test/factories';
import { BikeCard } from './BikeCard';

const meta = {
  title: 'Bikes/BikeCard',
  component: BikeCard,
} satisfies Meta<typeof BikeCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    bike: createMockBike({ name: 'Gravel commuter', brand: 'Canyon', year: 2023 }),
    onPress: fn(),
  },
};

export const WithoutThumbnail: Story = {
  args: {
    bike: createMockBike({ thumbnailStoragePath: undefined }),
    onPress: fn(),
  },
};
