import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { createMockLocation } from '@/test/factories';
import { LocationCard } from './LocationCard';

const meta = {
  title: 'Locations/LocationCard',
  component: LocationCard,
} satisfies Meta<typeof LocationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    location: createMockLocation({ label: 'Home', areaName: 'Berlin', isPrimary: true }),
    onPress: fn(),
    onDelete: fn(),
  },
};

export const Secondary: Story = {
  args: {
    location: createMockLocation({ label: 'Workshop', isPrimary: false }),
    onPress: fn(),
  },
};
