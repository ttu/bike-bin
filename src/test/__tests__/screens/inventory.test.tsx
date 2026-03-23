import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import InventoryScreen from '../../../../app/(tabs)/inventory/index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
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
    user: null,
    isAuthenticated: false,
    session: null,
    isLoading: false,
  }),
}));

jest.mock('@/features/auth/hooks/useLocalInventory', () => ({
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

describe('InventoryScreen', () => {
  it('renders the search bar', () => {
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByPlaceholderText(/Search/)).toBeTruthy();
  });

  it('renders empty state when no items', () => {
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByText('No items yet')).toBeTruthy();
  });

  it('renders category filter chips', () => {
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Components')).toBeTruthy();
    expect(screen.getByText('Tools')).toBeTruthy();
    expect(screen.getByText('Accessories')).toBeTruthy();
  });

  it('hides FAB when showing empty state', () => {
    renderWithProviders(<InventoryScreen />);
    expect(screen.queryByLabelText('Add item')).toBeNull();
  });
});
