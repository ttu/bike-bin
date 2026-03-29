import { Alert } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemStatus, ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { Item, ItemId } from '@/shared/types';
import ItemDetailScreen from '../[id]';

const mockRouterReplace = jest.fn();
const mockDismiss = jest.fn();
const mockCanDismiss = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-123' }),
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    push: jest.fn(),
    canDismiss: () => mockCanDismiss(),
    dismiss: (...args: unknown[]) => mockDismiss(...args),
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

const mockArchivedItem: Item = createMockItem({
  ...mockStoredItem,
  status: ItemStatus.Archived,
});

let mockItemForDetail: Item = mockStoredItem;

jest.mock('@/features/inventory', () => {
  const actual = jest.requireActual<typeof import('@/features/inventory')>('@/features/inventory');
  return {
    ...actual,
    useItem: () => ({
      get data() {
        return mockItemForDetail;
      },
      isLoading: false,
    }),
    useItemPhotos: () => ({ data: [] }),
    useUpdateItemStatus: () => ({ mutateAsync: mockUpdateStatusMutateAsync }),
    useDeleteItem: () => ({ mutateAsync: mockDeleteMutateAsync }),
  };
});

jest.mock('@/features/exchange', () => ({
  useMarkDonated: () => ({ mutate: jest.fn() }),
  useMarkSold: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/features/borrow', () => ({
  useAcceptedBorrowRequestForItem: () => ({ data: undefined, isFetching: false }),
  useMarkReturned: () => ({ mutate: jest.fn() }),
}));

jest.spyOn(Alert, 'alert');

describe('ItemDetailScreen back navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls router.dismiss(1) when tab stack can dismiss', () => {
    mockCanDismiss.mockReturnValue(true);
    const { getByRole } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByRole('button', { name: 'Back' }));

    expect(mockDismiss).toHaveBeenCalledWith(1);
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('replaces to inventory index when tab stack cannot dismiss', () => {
    mockCanDismiss.mockReturnValue(false);
    const { getByRole } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByRole('button', { name: 'Back' }));

    expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/inventory');
    expect(mockDismiss).not.toHaveBeenCalled();
  });
});

describe('ItemDetailScreen confirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanDismiss.mockReturnValue(true);
    mockItemForDetail = mockStoredItem;
  });

  it('opens remove-inventory dialog with archive and delete actions', () => {
    const { getByText, getByTestId } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Remove from inventory'));

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(getByTestId('remove-inventory-archive')).toBeTruthy();
    expect(getByTestId('remove-inventory-delete')).toBeTruthy();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('deletes item when delete is chosen and confirmation is accepted', async () => {
    const { getByText, getByTestId } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Remove from inventory'));
    fireEvent.press(getByTestId('remove-inventory-delete'));

    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Delete Item',
      'Are you sure you want to delete this item? This cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ]),
    );

    const confirmDelete = (Alert.alert as jest.Mock).mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === 'Delete',
    );
    await confirmDelete.onPress();

    expect(mockDeleteMutateAsync).toHaveBeenCalled();
  });

  it('shows archive confirmation after choosing archive from remove-inventory dialog', () => {
    const { getByText, getByTestId } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Remove from inventory'));
    fireEvent.press(getByTestId('remove-inventory-archive'));

    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Archive Item',
      'Are you sure you want to archive this item?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Archive' }),
      ]),
    );
    expect(mockUpdateStatusMutateAsync).not.toHaveBeenCalled();
  });

  it('archives item when archive is chosen and confirmation is accepted', () => {
    const { getByText, getByTestId } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Remove from inventory'));
    fireEvent.press(getByTestId('remove-inventory-archive'));

    const confirmArchive = (Alert.alert as jest.Mock).mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === 'Archive',
    );
    confirmArchive.onPress();

    expect(mockUpdateStatusMutateAsync).toHaveBeenCalledWith({
      id: 'item-123',
      status: ItemStatus.Archived,
    });
  });
});

describe('ItemDetailScreen archived item', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanDismiss.mockReturnValue(true);
    mockItemForDetail = mockArchivedItem;
  });

  afterAll(() => {
    mockItemForDetail = mockStoredItem;
  });

  it('shows restore and remove-from-inventory for archived item', () => {
    const { getByText, getByTestId, queryByTestId } = renderWithProviders(<ItemDetailScreen />);

    expect(getByText('Restore to inventory')).toBeTruthy();
    fireEvent.press(getByText('Remove from inventory'));
    expect(getByTestId('remove-inventory-delete')).toBeTruthy();
    expect(queryByTestId('remove-inventory-archive')).toBeNull();
  });

  it('restores item to stored when unarchive is confirmed', () => {
    const { getByText } = renderWithProviders(<ItemDetailScreen />);

    fireEvent.press(getByText('Restore to inventory'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Restore Item',
      'Restore this item to your inventory as stored? You can edit it again afterward.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Restore' }),
      ]),
    );

    const confirmRestore = (Alert.alert as jest.Mock).mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === 'Restore',
    );
    confirmRestore.onPress();

    expect(mockUpdateStatusMutateAsync).toHaveBeenCalledWith({
      id: 'item-123',
      status: ItemStatus.Stored,
    });
  });
});
