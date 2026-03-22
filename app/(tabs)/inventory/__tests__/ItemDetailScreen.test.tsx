import { Alert } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemStatus, ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { ItemId } from '@/shared/types';
import ItemDetailScreen from '../[id]';

const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-123' }),
  router: {
    back: (...args: unknown[]) => mockRouterBack(...args),
    push: jest.fn(),
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

const mockDeleteMutateAsync = jest.fn();
const mockUpdateStatusMutateAsync = jest.fn();

const mockStoredItem = createMockItem({
  id: 'item-123' as ItemId,
  name: 'Test Cassette',
  category: ItemCategory.Component,
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Borrowable],
});

jest.mock('@/features/inventory', () => ({
  useItem: () => ({ data: mockStoredItem, isLoading: false }),
  useItemPhotos: () => ({ data: [] }),
  useUpdateItemStatus: () => ({ mutateAsync: mockUpdateStatusMutateAsync }),
  useDeleteItem: () => ({ mutateAsync: mockDeleteMutateAsync }),
}));

jest.mock('@/features/exchange', () => ({
  useMarkDonated: () => ({ mutate: jest.fn() }),
  useMarkSold: () => ({ mutate: jest.fn() }),
}));

jest.spyOn(Alert, 'alert');

describe('ItemDetailScreen confirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows confirmation before deleting item', () => {
    const { getByText } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Delete item'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Item',
      'Are you sure you want to delete this item? This cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ]),
    );
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('deletes item when confirmation is accepted', async () => {
    const { getByText } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Delete item'));

    const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === 'Delete',
    );
    await confirmButton.onPress();

    expect(mockDeleteMutateAsync).toHaveBeenCalled();
  });

  it('shows confirmation before archiving item', () => {
    const { getByText } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Archive'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Archive Item',
      'Are you sure you want to archive this item?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Archive' }),
      ]),
    );
    expect(mockUpdateStatusMutateAsync).not.toHaveBeenCalled();
  });

  it('archives item when confirmation is accepted', () => {
    const { getByText } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Archive'));

    const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === 'Archive',
    );
    confirmButton.onPress();

    expect(mockUpdateStatusMutateAsync).toHaveBeenCalledWith({
      id: 'item-123',
      status: ItemStatus.Archived,
    });
  });
});
