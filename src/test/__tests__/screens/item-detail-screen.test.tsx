import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import type { ItemId } from '@/shared/types';
import { AvailabilityType, ItemCategory, ItemCondition, ItemStatus } from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import ItemDetailScreen from '../../../../app/(tabs)/inventory/[id]';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://test.supabase.co/storage/item-photos/${path}` },
        }),
      }),
    },
  },
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();

let mockRouteParams: { id: string; fromBike?: string; photoLimitWarning?: string } = {
  id: 'item-detail-1',
};

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockPush(...args),
    canDismiss: () => false,
    dismiss: jest.fn(),
  },
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

jest.mock('@/features/inventory/components/ItemDetail/ItemDetail', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { View, Pressable, Text } = require('react-native');
  return {
    ItemDetail: (props: {
      onMarkDonated?: () => void;
      onMarkSold?: () => void;
      onMarkReturned?: () => void;
      onRemoveFromBin?: () => void;
      onUnarchive?: () => void;
    }) => (
      <View testID="item-detail-mock">
        {props.onMarkDonated ? (
          <Pressable testID="trigger-mark-donated" onPress={props.onMarkDonated}>
            <Text>Donate</Text>
          </Pressable>
        ) : null}
        {props.onMarkSold ? (
          <Pressable testID="trigger-mark-sold" onPress={props.onMarkSold}>
            <Text>Sell</Text>
          </Pressable>
        ) : null}
        {props.onMarkReturned ? (
          <Pressable testID="trigger-mark-returned" onPress={props.onMarkReturned}>
            <Text>Return</Text>
          </Pressable>
        ) : null}
        {props.onRemoveFromBin ? (
          <Pressable testID="trigger-remove" onPress={props.onRemoveFromBin}>
            <Text>Remove</Text>
          </Pressable>
        ) : null}
        {props.onUnarchive ? (
          <Pressable testID="trigger-unarchive" onPress={props.onUnarchive}>
            <Text>Unarchive</Text>
          </Pressable>
        ) : null}
      </View>
    ),
  };
});

const ITEM_ID = 'item-detail-1' as ItemId;

let mockItem = createMockItem({
  id: ITEM_ID,
  name: 'Test part',
  category: ItemCategory.Component,
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [
    AvailabilityType.Donatable,
    AvailabilityType.Sellable,
    AvailabilityType.Borrowable,
  ],
});

const mockUpdateMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);
const mockUpdateMutateAsync = jest.fn(() => Promise.resolve());
const mockDeleteMutateAsync = jest.fn(() => Promise.resolve());

const mockMarkDonatedMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);
const mockMarkSoldMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);
const mockMarkReturnedMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);

let mockAcceptedBorrowRequestId: string | undefined;

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual<typeof import('@/features/inventory')>('@/features/inventory'),
  useItem: () => ({ data: mockItem, isLoading: false }),
  useItemPhotos: () => ({ data: [] }),
  useUpdateItemStatus: () => ({
    mutate: mockUpdateMutate,
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteItem: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

jest.mock('@/features/borrow', () => ({
  ...jest.requireActual<typeof import('@/features/borrow')>('@/features/borrow'),
  useAcceptedBorrowRequestForItem: () => ({
    data: mockAcceptedBorrowRequestId,
    isFetching: false,
  }),
  useMarkReturned: () => ({ mutate: mockMarkReturnedMutate, isPending: false }),
}));

jest.mock('@/features/exchange', () => ({
  useMarkDonated: () => ({ mutate: mockMarkDonatedMutate, isPending: false }),
  useMarkSold: () => ({ mutate: mockMarkSoldMutate, isPending: false }),
}));

describe('ItemDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { id: ITEM_ID };
    mockAcceptedBorrowRequestId = 'borrow-1';
    mockItem = createMockItem({
      id: ITEM_ID,
      name: 'Test part',
      category: ItemCategory.Component,
      condition: ItemCondition.Good,
      status: ItemStatus.Stored,
      availabilityTypes: [
        AvailabilityType.Donatable,
        AvailabilityType.Sellable,
        AvailabilityType.Borrowable,
      ],
    });
  });

  it('navigates to edit from header action', () => {
    renderWithProviders(<ItemDetailScreen />);
    const headerButtons = screen.getAllByTestId('icon-button');
    fireEvent.press(headerButtons[headerButtons.length - 1]);
    expect(mockPush).toHaveBeenCalledWith(`/(tabs)/inventory/edit/${ITEM_ID}`);
  });

  it('uses tabScopedBack from inventory when back without fromBike', () => {
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('replaces to bike detail when fromBike param is set', () => {
    mockRouteParams = { id: ITEM_ID, fromBike: 'bike-99' };
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/bikes/bike-99');
  });

  it('shows photo limit snackbar when photoLimitWarning is set', () => {
    mockRouteParams = { id: ITEM_ID, photoLimitWarning: '1' };
    renderWithProviders(<ItemDetailScreen />);
    expect(screen.getByText(/plan photo limit reached/i)).toBeTruthy();
  });

  it('completes mark donated flow', async () => {
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-donated'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockMarkDonatedMutate).toHaveBeenCalled();
    });
  });

  it('completes mark sold flow', async () => {
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-sold'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockMarkSoldMutate).toHaveBeenCalled();
    });
  });

  it('opens remove dialog and completes delete flow', async () => {
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-remove'));
    fireEvent.press(screen.getByTestId('remove-inventory-delete'));
    await waitFor(() => expect(screen.getByTestId('confirm-dialog-confirm')).toBeTruthy());
    const confirmButtons = screen.getAllByTestId('confirm-dialog-confirm');
    fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalled();
      expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/inventory');
    });
  });

  it('mark returned uses borrow request id when present', async () => {
    mockItem = createMockItem({
      id: ITEM_ID,
      status: ItemStatus.Loaned,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    mockAcceptedBorrowRequestId = 'borrow-1';
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-returned'));
    const confirmButtons = screen.getAllByTestId('confirm-dialog-confirm');
    fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => {
      expect(mockMarkReturnedMutate.mock.calls[0]?.[0]).toEqual({
        requestId: 'borrow-1',
        itemId: ITEM_ID,
      });
    });
  });

  it('mark returned falls back to status update when no borrow id', async () => {
    mockItem = createMockItem({
      id: ITEM_ID,
      status: ItemStatus.Loaned,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    mockAcceptedBorrowRequestId = undefined;
    mockUpdateMutateAsync.mockResolvedValueOnce(undefined);
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-returned'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalled();
    });
  });
});
