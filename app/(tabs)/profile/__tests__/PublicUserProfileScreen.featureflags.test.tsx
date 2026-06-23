import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import PublicUserProfileScreen from '../[userId]';

jest.mock('@/shared/utils/featureFlags', () => ({
  isMarketplaceEnabled: false,
  isGroupsEnabled: false,
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    useLocalSearchParams: () => ({ userId: 'public-user-1' }),
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  };
});

describe('PublicUserProfileScreen feature flags', () => {
  it('redirects to inventory when the marketplace is disabled', () => {
    renderWithProviders(<PublicUserProfileScreen />);
    expect(screen.getByTestId('redirect').props.children).toBe('/(tabs)/inventory');
  });
});
