import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../../types';
import { BikeForm } from './BikeForm';

const meta = {
  title: 'Bikes/BikeForm',
  component: BikeForm,
} satisfies Meta<typeof BikeForm>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleBike: BikeFormData = {
  name: 'Winter commuter',
  brand: 'Canyon',
  model: 'Commuter 7',
  type: BikeType.City,
  year: 2022,
  distanceKm: 3200,
  usageHours: undefined,
  condition: ItemCondition.Good,
  notes: 'Fenders and rack included.',
};

export const EditBike: Story = {
  args: {
    initialData: sampleBike,
    onSave: fn(),
    isSubmitting: false,
    isEditMode: true,
  },
};

export const NewBike: Story = {
  args: {
    onSave: fn(),
    isSubmitting: false,
    isEditMode: false,
  },
};
