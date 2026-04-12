import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import commonEn from '@/i18n/en/common.json';
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

jest.mock('@/features/locations', () => ({
  usePrimaryLocation: () => ({ data: undefined }),
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
    user: undefined,
    isAuthenticated: false,
    session: null,
    isLoading: true,
  }),
}));

describe('SearchScreen auth loading', () => {
  it('shows centered loading while auth session is resolving', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
  });
});
