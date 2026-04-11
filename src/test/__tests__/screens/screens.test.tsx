import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import searchEn from '@/i18n/en/search.json';
import InventoryScreen from '../../../../app/(tabs)/inventory/index';
import SearchScreen from '../../../../app/(tabs)/search/index';
import MessagesScreen from '../../../../app/(tabs)/messages/index';
import ProfileScreen from '../../../../app/(tabs)/profile/index';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  router: { push: mockRouterPush, replace: jest.fn() },
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
    user: null,
    isAuthenticated: false,
    session: null,
    isLoading: false,
  }),
}));

jest.mock('@/features/inventory/hooks/useLocalInventory', () => ({
  useLocalInventory: () => ({
    items: [],
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateItem: jest.fn(),
    clearAll: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('@/features/auth/components/SyncBanner/SyncBanner', () => ({
  SyncBanner: () => null,
}));

const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
const mockFrame = { x: 0, y: 0, width: 0, height: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
  SafeAreaProvider: jest.fn(({ children }) => children),
  SafeAreaConsumer: jest.fn(({ children }) => children(mockInsets)),
  SafeAreaView: jest.fn(({ children }) => children),
  SafeAreaInsetsContext: {
    Consumer: jest.fn(({ children }) => children(mockInsets)),
    Provider: jest.fn(({ children }) => children),
  },
  initialWindowMetrics: { insets: mockInsets, frame: mockFrame },
}));

describe('Tab screens render visible content', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
  });

  it('Inventory screen shows search bar', () => {
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByPlaceholderText(/Search/)).toBeVisible();
  });

  it('Search screen shows guest sign-in prompt when unauthenticated', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByText('Sign in to search')).toBeVisible();
  });

  it('Search screen guest CTA navigates to login', () => {
    renderWithProviders(<SearchScreen />);
    fireEvent.press(screen.getByText(searchEn.authRequired.signIn));
    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/login');
  });

  it('Messages screen shows heading', () => {
    renderWithProviders(<MessagesScreen />);
    expect(screen.getByText('Messages')).toBeVisible();
  });

  it('Profile screen shows heading', () => {
    renderWithProviders(<ProfileScreen />);
    expect(screen.getByText('Profile')).toBeVisible();
  });
});
