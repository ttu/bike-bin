import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { PhotoPicker } from './PhotoPicker';

const SAMPLE_URI = 'https://picsum.photos/seed/bikebin-picker/320/320';

const meta = {
  title: 'Shared/PhotoPicker',
  component: PhotoPicker,
} satisfies Meta<typeof PhotoPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    photos: [],
    onAdd: fn(),
    isUploading: false,
  },
};

export const WithLocalPreview: Story = {
  args: {
    photos: [
      { id: 'p1', storagePath: 'story/p1.jpg', localUri: SAMPLE_URI },
      { id: 'p2', storagePath: 'story/p2.jpg', localUri: SAMPLE_URI },
    ],
    onAdd: fn(),
    onRemove: fn(),
    onSetPrimary: fn(),
    isUploading: false,
  },
};
