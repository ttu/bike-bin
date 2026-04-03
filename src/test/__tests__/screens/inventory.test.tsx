import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import type { Item } from '@/shared/types';
import { ItemCategory, ItemStatus } from '@/shared/types';
import InventoryScreen from '../../../../app/(tabs)/inventory/index';

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
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
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://test.supabase.co/storage/item-photos/${path}` },
        }),
      }),
    },
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

const mockUserTags = jest.fn(() => ({ data: undefined as string[] | undefined }));
jest.mock('@/features/inventory', () => ({
  ...jest.requireActual('@/features/inventory'),
  useUserTags: () => mockUserTags(),
  useItems: () => ({ data: [], isLoading: false, refetch: jest.fn() }),
}));

const mockLocalInventory = {
  items: [] as Item[],
  addItem: jest.fn(),
  removeItem: jest.fn(),
  updateItem: jest.fn(),
  clearAll: jest.fn(),
  isLoading: false,
};

jest.mock('@/features/inventory/hooks/useLocalInventory', () => ({
  useLocalInventory: () => mockLocalInventory,
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
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockLocalInventory.items = [];
  });

  it('navigates to bikes list when bikes link is pressed', () => {
    renderWithProviders(<InventoryScreen />);
    fireEvent.press(screen.getByText('Bikes →'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/bikes');
  });

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

  it('gallery view hides list-only category line and shows items via image tiles only', () => {
    mockLocalInventory.items = [
      createMockItem({
        name: 'Helix Bolt',
        category: ItemCategory.Component,
        subcategory: 'drivetrain',
        status: ItemStatus.Stored,
      }),
    ];
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByText(/Components · Drivetrain/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Gallery view'));
    expect(screen.queryByText(/Components · Drivetrain/)).toBeNull();
    expect(screen.queryByText('Helix Bolt')).toBeNull();
    expect(screen.getByLabelText('Helix Bolt')).toBeTruthy();
  });

  it('removes stale tag filters when tags are deleted', async () => {
    mockUserTags.mockReturnValue({ data: ['brakes', 'wheels'] });
    const { rerender } = renderWithProviders(<InventoryScreen />);

    // Select the "brakes" tag filter
    fireEvent.press(screen.getByText('brakes'));

    // Simulate the tag being deleted (no longer returned by useUserTags)
    mockUserTags.mockReturnValue({ data: ['wheels'] });
    rerender(<InventoryScreen />);

    // The stale "brakes" tag should be pruned from selectedTags,
    // so "brakes" chip should no longer be rendered
    await waitFor(() => {
      expect(screen.queryByText('brakes')).toBeNull();
    });
    // "wheels" should still be visible
    expect(screen.getByText('wheels')).toBeTruthy();
  });
});
