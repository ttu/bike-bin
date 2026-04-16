import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { PhotoGallery } from './PhotoGallery';

const meta = {
  title: 'Shared/PhotoGallery',
  component: PhotoGallery,
} satisfies Meta<typeof PhotoGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    photos: [],
    onPhotoLongPress: fn(),
  },
};
