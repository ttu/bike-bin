import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import type { Item, ItemId } from '@/shared/types';
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

const mockUserTags = jest.fn(() => ({ data: undefined as string[] | undefined }));

const mockServerItems: Item[] = [
  createMockItem({
    id: 'item-alpha' as ItemId,
    name: 'Alpha Pedal',
    category: ItemCategory.Component,
    subcategory: 'pedals',
    brand: 'UniqueBrandX',
    model: 'X1',
    status: ItemStatus.Stored,
  }),
  createMockItem({
    id: 'item-arch' as ItemId,
    name: 'Archived Thing',
    category: ItemCategory.Component,
    subcategory: 'other',
    brand: 'Other',
    status: ItemStatus.Archived,
  }),
];

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    isAuthenticated: true,
    session: null,
    isLoading: false,
  }),
}));

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual<typeof import('@/features/inventory')>('@/features/inventory'),
  useUserTags: () => mockUserTags(),
  useItems: () => ({
    data: mockServerItems,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useInventoryRowCapacity: () => ({
    atLimit: false,
    limit: 100,
    isReady: true,
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

describe('InventoryScreen (authenticated)', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
  });

  it('filters by search, category, terminal toggle, opens item, and adds with category', () => {
    renderWithProviders(<InventoryScreen />);

    fireEvent.changeText(screen.getByPlaceholderText(/Search/), 'UniqueBrandX');
    fireEvent.press(screen.getByText('Components'));
    fireEvent.press(screen.getByText(/Show inactive/));

    fireEvent.press(screen.getByText('Alpha Pedal'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/inventory/item-alpha');

    fireEvent.press(screen.getByLabelText('Add item'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/inventory/new?category=component');
  });
});
