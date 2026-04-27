import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import commonEn from '@/i18n/en/common.json';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemCategory, ItemStatus, type Item, type ItemId, type UserId } from '@/shared/types';
import inventoryEn from '@/i18n/en/inventory.json';
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

const mockUseItemsState = {
  data: [] as Item[],
  isLoading: false,
  isRefetching: false,
  refetch: jest.fn(),
};

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
    user: { id: 'user-1' as UserId },
    isAuthenticated: true,
    session: null,
    isLoading: false,
  }),
}));

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual<typeof import('@/features/inventory')>('@/features/inventory'),
  useUserTags: () => mockUserTags(),
  useItems: () => ({
    data: mockUseItemsState.data,
    isLoading: mockUseItemsState.isLoading,
    isRefetching: mockUseItemsState.isRefetching,
    refetch: mockUseItemsState.refetch,
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
    mockUseItemsState.data = mockServerItems;
    mockUseItemsState.isLoading = false;
    mockUseItemsState.isRefetching = false;
    mockUseItemsState.refetch.mockClear();
  });

  it('shows centered loading when server items are loading and list is empty', () => {
    mockUseItemsState.data = [];
    mockUseItemsState.isLoading = true;
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
    expect(screen.queryByTestId('inventory-items-list')).toBeNull();
  });

  it('passes isRefetching to RefreshControl when list has items', () => {
    mockUseItemsState.isRefetching = true;
    renderWithProviders(<InventoryScreen />);
    const list = screen.getByTestId('inventory-items-list');
    const refreshControl = list.props.refreshControl as {
      props: { refreshing?: boolean };
    };
    expect(refreshControl.props.refreshing).toBe(true);
  });

  it('filters by search, category, terminal toggle, opens item, and adds with category', () => {
    renderWithProviders(<InventoryScreen />);

    const searchPlaceholder = inventoryEn.searchPlaceholder_one.replace('{{count}}', '1');

    fireEvent.changeText(screen.getByPlaceholderText(searchPlaceholder), 'UniqueBrandX');
    fireEvent.press(screen.getByText(inventoryEn.category.component));
    fireEvent.press(screen.getByText(inventoryEn.filters.showInactive.replace('{{count}}', '1')));

    fireEvent.press(screen.getByText('Alpha Pedal'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/inventory/item-alpha');

    fireEvent.press(screen.getByLabelText(inventoryEn.addItem));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/inventory/new?category=component');
  });

  it('shows hero card with recentlyAdded badge by default', () => {
    renderWithProviders(<InventoryScreen />);
    // Hero card has a unique a11y label
    expect(screen.getByLabelText(/Latest item: Alpha Pedal/i)).toBeTruthy();
  });

  it('shows hero card when sort is cycled to recentlyUpdated', () => {
    renderWithProviders(<InventoryScreen />);
    const sortA11yLabel = `${inventoryEn.sort.label}, ${inventoryEn.sort.recentlyAdded}, ${inventoryEn.sort.hint}`;
    fireEvent.press(screen.getByLabelText(sortA11yLabel));
    expect(screen.getByLabelText(/Latest item:/i)).toBeTruthy();
  });

  it('renders multiple list items below the hero card (exercises ItemSeparator and GroupedCell)', () => {
    mockUseItemsState.data = [
      createMockItem({ id: 'item-s1' as ItemId, name: 'Stem Alpha', status: ItemStatus.Stored }),
      createMockItem({ id: 'item-s2' as ItemId, name: 'Stem Beta', status: ItemStatus.Stored }),
      createMockItem({ id: 'item-s3' as ItemId, name: 'Stem Gamma', status: ItemStatus.Stored }),
    ];
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByText('Stem Beta')).toBeTruthy();
    expect(screen.getByText('Stem Gamma')).toBeTruthy();
  });

  it('hides hero card when sort is name', () => {
    renderWithProviders(<InventoryScreen />);
    const sortA11yLabel1 = `${inventoryEn.sort.label}, ${inventoryEn.sort.recentlyAdded}, ${inventoryEn.sort.hint}`;
    const sortA11yLabel2 = `${inventoryEn.sort.label}, ${inventoryEn.sort.recentlyUpdated}, ${inventoryEn.sort.hint}`;
    fireEvent.press(screen.getByLabelText(sortA11yLabel1));
    fireEvent.press(screen.getByLabelText(sortA11yLabel2));
    expect(screen.getByText(inventoryEn.sort.name)).toBeTruthy();
    expect(screen.queryByLabelText(/Latest item:/i)).toBeNull();
  });
});
