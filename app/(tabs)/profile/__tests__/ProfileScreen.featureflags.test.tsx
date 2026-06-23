import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import borrowEn from '@/i18n/en/borrow.json';
import profileEn from '@/i18n/en/profile.json';
import ProfileScreen from '../index';

let mockMarketplace = true;

jest.mock('@/shared/utils/featureFlags', () => ({
  get isMarketplaceEnabled() {
    return mockMarketplace;
  },
  get isGroupsEnabled() {
    return false;
  },
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    storage: { from: jest.fn() },
  },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
  };
});

jest.mock('@/features/profile', () => ({
  ProfileHeader: () => null,
  useProfile: () => ({ data: undefined, isLoading: false }),
  useDistanceUnit: () => ({ distanceUnit: 'km' as const, setDistanceUnit: jest.fn() }),
}));

jest.mock('@/features/borrow', () => ({
  useBorrowRequests: () => ({ data: [] }),
}));

jest.mock('@/features/demo', () => {
  const actual = jest.requireActual<typeof import('@/features/demo')>('@/features/demo');
  return {
    ...actual,
    useDemoMode: () => ({ isDemoMode: false, enterDemoMode: jest.fn(), exitDemoMode: jest.fn() }),
  };
});

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
    session: null,
    signOut: jest.fn(),
    isLoading: false,
  }),
}));

describe('ProfileScreen feature flags', () => {
  afterEach(() => {
    mockMarketplace = true;
  });

  it('renders the Borrow Requests menu item when the marketplace is enabled', () => {
    mockMarketplace = true;
    renderWithProviders(<ProfileScreen />);
    expect(screen.getByText(borrowEn.profileMenu.label)).toBeTruthy();
  });

  it('hides the Borrow Requests menu item when the marketplace is disabled', () => {
    mockMarketplace = false;
    renderWithProviders(<ProfileScreen />);
    expect(screen.queryByText(borrowEn.profileMenu.label)).toBeNull();
    // The rest of the profile menu still renders.
    expect(screen.getByText(profileEn.menu.savedLocations)).toBeTruthy();
  });
});
