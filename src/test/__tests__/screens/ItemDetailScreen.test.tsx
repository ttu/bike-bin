import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import type { ItemId } from '@/shared/types';
import { AvailabilityType, ItemCategory, ItemCondition, ItemStatus } from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import commonEn from '@/i18n/en/common.json';
import inventoryEn from '@/i18n/en/inventory.json';
import { mockAuthModule } from '@/test/authMocks';
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

let mockRouteParams: {
  id: string;
  fromBike?: string | string[];
  photoLimitWarning?: string;
} = {
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
      readonly onMarkDonated?: () => void;
      readonly onMarkSold?: () => void;
      readonly onMarkReturned?: () => void;
      readonly onRemoveFromBin?: () => void;
      readonly onUnarchive?: () => void;
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

jest.mock('@/features/auth', () => mockAuthModule);

const mockTransferMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);
let mockTransferIsPending = false;
jest.mock('@/features/inventory/hooks/useTransferItem', () => ({
  useTransferItem: () => ({ mutate: mockTransferMutate, isPending: mockTransferIsPending }),
}));

const mockCanEditItem = jest.fn<boolean, unknown[]>(() => true);
const mockCanTransferItem = jest.fn<boolean, unknown[]>(() => false);
jest.mock('@/features/inventory/utils/itemPermissions', () => ({
  canEditItem: (...args: unknown[]) => mockCanEditItem(...args),
  canTransferItem: (...args: unknown[]) => mockCanTransferItem(...args),
}));

jest.mock('@/features/groups', () => ({
  useGroups: () => ({
    data: [
      {
        id: 'group-1',
        name: 'Test Group',
        memberRole: 'admin',
        joinedAt: '2026-01-01',
      },
    ],
  }),
}));

describe('ItemDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { id: ITEM_ID };
    mockAcceptedBorrowRequestId = 'borrow-1';
    mockTransferIsPending = false;
    mockCanEditItem.mockReturnValue(true);
    mockCanTransferItem.mockReturnValue(false);
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

  it('uses first fromBike value when param is a string array', () => {
    mockRouteParams = { id: ITEM_ID, fromBike: ['bike-from-array'] };
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/bikes/bike-from-array');
  });

  it('dismisses photo limit snackbar via action', async () => {
    jest.useFakeTimers();
    try {
      mockRouteParams = { id: ITEM_ID, photoLimitWarning: '1' };
      renderWithProviders(<ItemDetailScreen />);
      expect(screen.getByText(inventoryEn.limit.saveSnackbarPhoto)).toBeTruthy();
      fireEvent.press(screen.getByText(commonEn.actions.close));
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.queryByText(inventoryEn.limit.saveSnackbarPhoto)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows generic error when mark donated fails', async () => {
    mockMarkDonatedMutate.mockImplementationOnce(
      (_vars: unknown, opts?: { onError?: () => void }) => {
        opts?.onError?.();
      },
    );
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-donated'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('shows generic error when mark sold fails', async () => {
    mockMarkSoldMutate.mockImplementationOnce((_vars: unknown, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-sold'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('shows generic error when archive status update fails', async () => {
    mockUpdateMutate.mockImplementationOnce((_vars: unknown, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-remove'));
    fireEvent.press(screen.getByTestId('remove-inventory-archive'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('completes unarchive flow for archived items', async () => {
    mockItem = createMockItem({
      id: ITEM_ID,
      status: ItemStatus.Archived,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-unarchive'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalled();
    });
  });

  it('shows generic error when unarchive fails', async () => {
    mockItem = createMockItem({
      id: ITEM_ID,
      status: ItemStatus.Archived,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    mockUpdateMutate.mockImplementationOnce((_vars: unknown, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-unarchive'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('shows generic error when delete fails', async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error('delete failed'));
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-remove'));
    fireEvent.press(screen.getByTestId('remove-inventory-delete'));
    await waitFor(() => expect(screen.getByTestId('confirm-dialog-confirm')).toBeTruthy());
    const confirmButtons = screen.getAllByTestId('confirm-dialog-confirm');
    fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('shows generic error when mark returned mutation fails', async () => {
    mockItem = createMockItem({
      id: ITEM_ID,
      status: ItemStatus.Loaned,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    mockAcceptedBorrowRequestId = 'borrow-1';
    mockMarkReturnedMutate.mockImplementationOnce(
      (_vars: unknown, opts?: { onError?: () => void }) => {
        opts?.onError?.();
      },
    );
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-returned'));
    const confirmButtons = screen.getAllByTestId('confirm-dialog-confirm');
    fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('shows generic error when fallback return status update fails', async () => {
    mockItem = createMockItem({
      id: ITEM_ID,
      status: ItemStatus.Loaned,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    mockAcceptedBorrowRequestId = undefined;
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error('status failed'));
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByTestId('trigger-mark-returned'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('hides edit button when canEditItem returns false', () => {
    mockCanEditItem.mockReturnValue(false);
    renderWithProviders(<ItemDetailScreen />);
    const pencilButtons = screen
      .getAllByTestId('icon-button')
      .filter((btn) => btn.props.accessibilityLabel !== 'Back');
    expect(pencilButtons).toHaveLength(0);
  });

  it('shows transfer-to-group button for personal items when canTransferItem allows', () => {
    mockCanTransferItem.mockReturnValue(true);
    renderWithProviders(<ItemDetailScreen />);
    expect(screen.getByLabelText(/transfer/i)).toBeTruthy();
  });

  it('opens transfer dialog when transfer-to-group button is pressed', () => {
    mockCanTransferItem.mockReturnValue(true);
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByLabelText(/transfer/i));
    expect(screen.getByText(/transfer to group/i)).toBeTruthy();
  });

  it('shows transfer-to-me button for group items and triggers confirm', async () => {
    mockCanTransferItem.mockReturnValue(true);
    mockItem = createMockItem({
      id: ITEM_ID,
      groupId: 'group-1' as import('@/shared/types').GroupId,
      status: ItemStatus.Stored,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByLabelText(/transfer to me/i));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockTransferMutate).toHaveBeenCalledWith(
        expect.objectContaining({ itemId: ITEM_ID }),
        expect.any(Object),
      );
    });
  });

  it('shows error snackbar when transfer-to-me fails', async () => {
    mockCanTransferItem.mockReturnValue(true);
    mockTransferMutate.mockImplementationOnce((_vars: unknown, opts?: { onError?: () => void }) => {
      opts?.onError?.();
    });
    mockItem = createMockItem({
      id: ITEM_ID,
      groupId: 'group-1' as import('@/shared/types').GroupId,
      status: ItemStatus.Stored,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    renderWithProviders(<ItemDetailScreen />);
    fireEvent.press(screen.getByLabelText(/transfer to me/i));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(/failed to transfer/i)).toBeTruthy();
    });
  });
});
