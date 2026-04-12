import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import commonEn from '@/i18n/en/common.json';
import searchEn from '@/i18n/en/search.json';
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
    user: { id: 'u1' },
    isAuthenticated: true,
    session: {},
    isLoading: false,
  }),
}));

jest.mock('@/features/search', () => {
  const actual = jest.requireActual<typeof import('@/features/search')>('@/features/search');
  return {
    ...actual,
    useSearchItems: () => ({
      data: undefined,
      isLoading: true,
    }),
  };
});

describe('SearchScreen search results loading', () => {
  it('shows loading in list area while search results are loading after submit', () => {
    renderWithProviders(<SearchScreen />);
    const input = screen.getByPlaceholderText(searchEn.searchPlaceholder);
    fireEvent.changeText(input, 'pedal');
    fireEvent(input, 'submitEditing');
    expect(screen.getAllByLabelText(commonEn.loading.a11y).length).toBeGreaterThanOrEqual(1);
  });
});
