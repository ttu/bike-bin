import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import SearchScreen from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({})),
  router: { push: jest.fn() },
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    isAuthenticated: true,
    session: {},
    isLoading: false,
  }),
}));

jest.mock('@/features/locations', () => ({
  usePrimaryLocation: () => ({ data: undefined }),
}));

jest.mock('@/features/demo', () => {
  const actual = jest.requireActual<typeof import('@/features/demo')>('@/features/demo');
  return {
    ...actual,
    useDemoMode: () => ({
      isDemoMode: true,
      enterDemoMode: jest.fn(),
      exitDemoMode: jest.fn(),
    }),
  };
});

describe('SearchScreen scroll layout', () => {
  it('keeps search field fixed while quick filters live in the scrollable list (demo results)', () => {
    renderWithProviders(<SearchScreen />);

    expect(screen.getByPlaceholderText('Parts, tools, bikes...')).toBeTruthy();
    expect(screen.getByText('Borrow')).toBeTruthy();
    expect(screen.getByText('Donate')).toBeTruthy();
  });
});
