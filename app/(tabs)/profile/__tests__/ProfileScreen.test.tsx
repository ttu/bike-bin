import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import commonEn from '@/i18n/en/common.json';
import profileEn from '@/i18n/en/profile.json';
import ProfileScreen from '../index';

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
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

const mockUseProfile = jest.fn();

jest.mock('@/features/profile', () => ({
  ProfileHeader: () => null,
  useProfile: (userId: string | undefined) => mockUseProfile(userId),
  useDistanceUnit: () => ({
    distanceUnit: 'km' as const,
    setDistanceUnit: jest.fn(),
  }),
}));

jest.mock('@/features/borrow', () => ({
  useBorrowRequests: () => ({ data: [] }),
}));

jest.mock('@/features/demo', () => {
  const actual = jest.requireActual<typeof import('@/features/demo')>('@/features/demo');
  return {
    ...actual,
    useDemoMode: () => ({
      isDemoMode: false,
      enterDemoMode: jest.fn(),
      exitDemoMode: jest.fn(),
    }),
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

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true });
  });

  it('shows profile loading indicator while profile query is loading', () => {
    renderWithProviders(<ProfileScreen />);
    expect(screen.getByText(profileEn.title)).toBeTruthy();
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
  });
});
