import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet } from 'react-native';
import { CachedListThumbnail } from './CachedListThumbnail';

const SAMPLE_URI = 'https://picsum.photos/seed/bikebin-thumb/240/240';

const styles = StyleSheet.create({
  thumb: { width: 120, height: 120, borderRadius: 8 },
});

const meta = {
  title: 'Shared/CachedListThumbnail',
  component: CachedListThumbnail,
} satisfies Meta<typeof CachedListThumbnail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RemoteImage: Story = {
  args: {
    uri: SAMPLE_URI,
    cacheKey: 'storybook-thumb',
    style: styles.thumb,
  },
};
