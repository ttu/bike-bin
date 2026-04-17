import type { Meta, StoryObj } from '@storybook/react-native';
import { CachedAvatarImage } from './CachedAvatarImage';

const SAMPLE_URI = 'https://picsum.photos/seed/bikebin-avatar/128/128';

const meta = {
  title: 'Shared/CachedAvatarImage',
  component: CachedAvatarImage,
} satisfies Meta<typeof CachedAvatarImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    uri: SAMPLE_URI,
    size: 64,
    cacheKey: 'storybook-avatar',
  },
};
