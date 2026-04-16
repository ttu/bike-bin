import type { Meta, StoryObj } from '@storybook/react-native';
import type { UserProfile } from '@/shared/types';
import { ProfileHeader } from './ProfileHeader';

type ProfileHeaderProfile = Pick<
  UserProfile,
  'displayName' | 'avatarUrl' | 'ratingAvg' | 'ratingCount' | 'createdAt'
>;

const meta = {
  title: 'Profile/ProfileHeader',
  component: ProfileHeader,
} satisfies Meta<typeof ProfileHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseProfile: ProfileHeaderProfile = {
  displayName: 'Jordan Rider',
  avatarUrl: undefined,
  ratingAvg: 4.6,
  ratingCount: 21,
  createdAt: '2025-03-10T08:00:00Z',
};

export const WithRatings: Story = {
  args: {
    profile: baseProfile,
  },
};

export const NoDisplayName: Story = {
  args: {
    profile: {
      ...baseProfile,
      displayName: undefined,
      ratingCount: 0,
    },
  },
};
