import { fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { renderWithProviders } from '@/test/utils';
import ListingDetailScreen from '../[id]';

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-1' }),
  useRouter: () => ({
    canGoBack: () => true,
    back: mockRouterBack,
    push: mockRouterPush,
    replace: jest.fn(),
  }),
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

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

// Mock item data returned by useQuery
const mockItem = {
  id: 'item-1',
  ownerId: 'owner-1',
  name: 'Test Bike Part',
  category: 'Component',
  condition: 'Good',
  availabilityTypes: ['borrowable'],
  visibility: 'all',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ownerDisplayName: 'Alice',
  ownerRatingAvg: 4.5,
  ownerRatingCount: 10,
};

// Photos with camelCase storagePath (after proper mapping)
const mockPhotosMapped = [
  {
    id: 'photo-1',
    itemId: 'item-1',
    storagePath: 'items/photo1.jpg',
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// Capture queryFn callbacks for testing mapping logic
const mockQueryCallbacks: Record<string, () => Promise<unknown>> = {};

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (opts: { queryKey: string[]; queryFn: () => Promise<unknown> }) => {
      mockQueryCallbacks[opts.queryKey[0]] = opts.queryFn;
      if (opts.queryKey[0] === 'listing') {
        return { data: mockItem, isLoading: false };
      }
      if (opts.queryKey[0] === 'item_photos') {
        return { data: mockPhotosMapped, isLoading: false };
      }
      return { data: undefined, isLoading: true };
    },
  };
});

const mockCreateConversation = jest.fn();
jest.mock('@/features/messaging', () => ({
  useCreateConversation: () => ({ mutate: mockCreateConversation }),
}));

jest.mock('@/features/borrow', () => ({
  useCreateBorrowRequest: () => ({ mutate: jest.fn() }),
}));

describe('ListingDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when photos have storagePath', () => {
    const { getByText } = renderWithProviders(<ListingDetailScreen />);
    expect(getByText('Test Bike Part')).toBeTruthy();
  });

  it('maps snake_case photo rows to camelCase via mapItemPhotoRow in queryFn', async () => {
    // Set up supabase mock to return snake_case data (as Supabase actually returns)
    const mockSupabase = jest.requireMock('@/shared/api/supabase');
    mockSupabase.supabase.from = () => ({
      select: () => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: [
                {
                  id: 'photo-1',
                  item_id: 'item-1',
                  storage_path: 'items/photo1.jpg',
                  sort_order: 0,
                  created_at: '2026-01-01T00:00:00Z',
                },
              ],
              error: null,
            }),
        }),
      }),
    });

    renderWithProviders(<ListingDetailScreen />);

    // Execute the photos queryFn to verify it maps snake_case to camelCase
    const photosQueryFn = mockQueryCallbacks['item_photos'];
    expect(photosQueryFn).toBeDefined();

    const result = await photosQueryFn();
    const photos = result as Array<{ storagePath?: string; storage_path?: string }>;

    expect(photos[0].storagePath).toBe('items/photo1.jpg');
    expect(photos[0]).not.toHaveProperty('storage_path');
  });

  it('shows an Alert when createConversation fails', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    // Override the useQuery mock to return a sellable item so the Contact button is visible
    const reactQuery = jest.requireMock('@tanstack/react-query');
    const originalUseQuery = reactQuery.useQuery;
    reactQuery.useQuery = (opts: { queryKey: string[]; queryFn: () => Promise<unknown> }) => {
      if (opts.queryKey[0] === 'listing') {
        return {
          data: { ...mockItem, availabilityTypes: ['donatable'] },
          isLoading: false,
        };
      }
      return originalUseQuery(opts);
    };

    const { getByText } = renderWithProviders(<ListingDetailScreen />);
    fireEvent.press(getByText('Contact'));

    // Simulate the onError callback being invoked by the mutation
    const [, callbacks] = mockCreateConversation.mock.calls[0] as [
      unknown,
      { onError: () => void },
    ];
    callbacks.onError();

    expect(alertSpy).toHaveBeenCalledWith('Failed to start conversation. Please try again.');

    reactQuery.useQuery = originalUseQuery;
    alertSpy.mockRestore();
  });
});
