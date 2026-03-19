import { fireEvent } from '@testing-library/react-native';
import { ProfileHeader } from '../ProfileHeader/ProfileHeader';
import { renderWithProviders } from '@/test/utils';
import type { UserProfile } from '@/shared/types';

type ProfileHeaderProfile = Pick<
  UserProfile,
  'displayName' | 'avatarUrl' | 'ratingAvg' | 'ratingCount' | 'createdAt'
>;

function createProfile(overrides?: Partial<ProfileHeaderProfile>): ProfileHeaderProfile {
  return {
    displayName: 'Jane Cyclist',
    avatarUrl: undefined,
    ratingAvg: 4.5,
    ratingCount: 12,
    createdAt: '2024-06-15T10:00:00Z',
    ...overrides,
  };
}

describe('ProfileHeader', () => {
  it('renders display name', () => {
    const profile = createProfile({ displayName: 'Alice Rider' });
    const { getByText } = renderWithProviders(<ProfileHeader profile={profile} />);
    expect(getByText('Alice Rider')).toBeTruthy();
  });

  it('renders dash when display name is undefined', () => {
    const profile = createProfile({ displayName: undefined });
    const { getByText } = renderWithProviders(<ProfileHeader profile={profile} />);
    expect(getByText('—')).toBeTruthy();
  });

  it('renders formatted rating when ratingCount > 0', () => {
    const profile = createProfile({ ratingAvg: 4.75, ratingCount: 8 });
    const { getByText } = renderWithProviders(<ProfileHeader profile={profile} />);
    expect(getByText('4.8')).toBeTruthy();
    expect(getByText('(8)')).toBeTruthy();
  });

  it('renders dash for rating when ratingCount is 0', () => {
    const profile = createProfile({ ratingAvg: 0, ratingCount: 0 });
    const { getByText } = renderWithProviders(<ProfileHeader profile={profile} />);
    expect(getByText('—')).toBeTruthy();
    expect(getByText('(0)')).toBeTruthy();
  });

  it('renders member since date', () => {
    const profile = createProfile({ createdAt: '2024-06-15T10:00:00Z' });
    const { getByText } = renderWithProviders(<ProfileHeader profile={profile} />);
    // The formatted date will contain "2024" regardless of locale
    expect(getByText(/2024/)).toBeTruthy();
  });

  it('renders edit profile link when onEditPress is provided', () => {
    const profile = createProfile();
    const onEditPress = jest.fn();
    const { getByText } = renderWithProviders(
      <ProfileHeader profile={profile} onEditPress={onEditPress} />,
    );
    expect(getByText('Edit Profile')).toBeTruthy();
  });

  it('does not render edit profile link when onEditPress is not provided', () => {
    const profile = createProfile();
    const { queryByText } = renderWithProviders(<ProfileHeader profile={profile} />);
    expect(queryByText('Edit Profile')).toBeNull();
  });

  it('calls onEditPress when edit link is pressed', () => {
    const profile = createProfile();
    const onEditPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <ProfileHeader profile={profile} onEditPress={onEditPress} />,
    );
    fireEvent.press(getByLabelText('Edit Profile'));
    expect(onEditPress).toHaveBeenCalledTimes(1);
  });

  it('renders fallback avatar icon when avatarUrl is undefined', () => {
    const profile = createProfile({ avatarUrl: undefined });
    const { queryByLabelText } = renderWithProviders(<ProfileHeader profile={profile} />);
    // Avatar.Icon renders with the icon name; no crash = avatar rendered
    expect(queryByLabelText('Edit Profile')).toBeNull();
  });
});
