import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import type { ItemId } from '@/shared/types';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Visibility,
} from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import commonEn from '@/i18n/en/common.json';
import EditItemScreen from '../../../../app/(tabs)/inventory/edit/[id]';

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

jest.mock('expo-router', () => {
  const { mockExpoRouterNavigation } =
    jest.requireActual<typeof import('@/test/routerMocks')>('@/test/routerMocks');
  return {
    ...mockExpoRouterNavigation,
    useLocalSearchParams: () => ({ id: 'item-edit-1' }),
  };
});

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockUpdateMutateAsync = jest.fn(() => Promise.resolve());
const mockDeleteMutateAsync = jest.fn(() => Promise.resolve());
const mockRemovePhotoMutate = jest.fn((_vars: unknown, opts?: { onSettled?: () => void }) => {
  opts?.onSettled?.();
});
const mockSwapPhotoMutate = jest.fn();

let mockItem = createMockItem({
  id: 'item-edit-1' as ItemId,
  name: 'Chain',
  category: ItemCategory.Component,
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Borrowable],
  visibility: Visibility.All,
});

let mockItemPhotos: { id: string; storagePath: string; sortOrder: number }[] = [];

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual<typeof import('@/features/inventory')>('@/features/inventory'),
  useItem: () => ({ data: mockItem, isLoading: false }),
  useItemPhotos: () => ({ data: mockItemPhotos }),
  useUpdateItem: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
  useDeleteItem: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
  usePhotoUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false }),
  useSwapItemPhotoOrder: () => ({ mutate: mockSwapPhotoMutate, isPending: false }),
  useRemoveItemPhoto: () => ({ mutate: mockRemovePhotoMutate, isPending: false }),
}));

jest.mock('@/features/inventory/components/PhotoPicker/PhotoPicker', () => ({
  PhotoPicker: ({ onRemove }: { onRemove: (photoId: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID="photo-picker-remove" onPress={() => onRemove('photo-1')}>
        <Text>Remove photo</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/features/inventory/components/ItemForm/ItemForm', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { View, Text, Pressable } = require('react-native');
  return {
    ItemForm: ({
      onSave,
      onDelete,
      photoSection,
    }: {
      onSave: (data: unknown) => void;
      onDelete?: () => void;
      photoSection?: unknown;
    }) => (
      <View testID="item-form-mock">
        {photoSection}
        <Pressable testID="item-form-save" onPress={() => onSave({})}>
          <Text>Save</Text>
        </Pressable>
        {onDelete ? (
          <Pressable testID="item-form-delete" onPress={onDelete}>
            <Text>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    ),
  };
});

describe('EditItemScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItemPhotos = [];
    mockItem = createMockItem({
      id: 'item-edit-1' as ItemId,
      name: 'Chain',
      category: ItemCategory.Component,
      condition: ItemCondition.Good,
      status: ItemStatus.Stored,
      availabilityTypes: [AvailabilityType.Borrowable],
      visibility: Visibility.All,
    });
    mockUpdateMutateAsync.mockImplementation(() => Promise.resolve());
    mockDeleteMutateAsync.mockImplementation(() => Promise.resolve());
  });

  it('renders edit title and back uses tabScopedBack', () => {
    renderWithProviders(<EditItemScreen />);
    expect(screen.getByText('Edit item')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('invokes save and delete from the form', () => {
    renderWithProviders(<EditItemScreen />);
    fireEvent.press(screen.getByTestId('item-form-save'));
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-edit-1',
      }),
    );
    fireEvent.press(screen.getByTestId('item-form-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-edit-1',
        status: mockItem.status,
      }),
    );
  });

  it('shows generic error when save fails', async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error('save failed'));
    renderWithProviders(<EditItemScreen />);
    fireEvent.press(screen.getByTestId('item-form-save'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('shows generic error when delete fails', async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error('delete failed'));
    renderWithProviders(<EditItemScreen />);
    fireEvent.press(screen.getByTestId('item-form-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('uses item thumbnail when there are no photos', () => {
    mockItem = createMockItem({
      id: 'item-edit-1' as ItemId,
      name: 'Chain',
      category: ItemCategory.Component,
      condition: ItemCondition.Good,
      status: ItemStatus.Stored,
      availabilityTypes: [AvailabilityType.Borrowable],
      visibility: Visibility.All,
      thumbnailStoragePath: 'items/thumb.jpg',
    });
    renderWithProviders(<EditItemScreen />);
    expect(screen.getByTestId('item-form-mock')).toBeTruthy();
  });

  it('removes a photo after confirming', async () => {
    mockItemPhotos = [{ id: 'photo-1', storagePath: 'items/p1.jpg', sortOrder: 0 }];
    renderWithProviders(<EditItemScreen />);
    fireEvent.press(screen.getByTestId('photo-picker-remove'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockRemovePhotoMutate).toHaveBeenCalled();
    });
  });
});
