import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import {
  ItemStatus,
  ItemCategory,
  ItemCondition,
  AvailabilityType,
  Visibility,
} from '@/shared/types';
import type { ItemId } from '@/shared/types';
import EditItemScreen from '../[id]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-123' }),
  router: {
    push: jest.fn(),
    canDismiss: () => true,
    dismiss: jest.fn(),
    replace: jest.fn(),
  },
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

const mockItem = createMockItem({
  id: 'item-123' as ItemId,
  name: 'Test Chain',
  category: ItemCategory.Component,
  subcategory: 'drivetrain',
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Borrowable],
  visibility: Visibility.Private,
  tags: ['shimano', 'road', '11-speed'],
});

const mockMutateAsync = jest.fn();

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual('@/features/inventory'),
  useItem: () => ({ data: mockItem, isLoading: false }),
  useItemPhotos: () => ({ data: [] }),
  useUpdateItem: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteItem: () => ({ mutateAsync: jest.fn() }),
  usePhotoUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false }),
  useUserTags: () => ({ data: ['shimano', 'road', '11-speed', 'mtb'] }),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
  };
});

describe('EditItemScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not show inventory id label in the hero header', () => {
    renderWithProviders(<EditItemScreen />);

    expect(screen.queryByText(/Inventory ID:/)).toBeNull();
  });

  it('displays existing tags when editing an item', () => {
    renderWithProviders(<EditItemScreen />);

    // Tags are behind the "More details" expandable section
    fireEvent.press(screen.getByText('More details'));

    expect(screen.getByText('shimano')).toBeTruthy();
    expect(screen.getByText('road')).toBeTruthy();
    expect(screen.getByText('11-speed')).toBeTruthy();
  });

  it('includes saved subcategory when updating without changing category fields', () => {
    renderWithProviders(<EditItemScreen />);

    fireEvent.press(screen.getByText('Update Inventory'));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-123',
        subcategory: 'drivetrain',
      }),
    );
  });
});
