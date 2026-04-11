import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
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

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-edit-1' }),
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockItem = createMockItem({
  id: 'item-edit-1' as ItemId,
  name: 'Chain',
  category: ItemCategory.Component,
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Borrowable],
  visibility: Visibility.All,
});

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual<typeof import('@/features/inventory')>('@/features/inventory'),
  useItem: () => ({ data: mockItem, isLoading: false }),
  useItemPhotos: () => ({ data: [] }),
  useUpdateItem: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteItem: () => ({ mutateAsync: jest.fn(), isPending: false }),
  usePhotoUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false }),
  useSwapItemPhotoOrder: () => ({ mutate: jest.fn(), isPending: false }),
  useRemoveItemPhoto: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/features/inventory/components/ItemForm/ItemForm', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { View, Text, Pressable } = require('react-native');
  return {
    ItemForm: ({
      onSave,
      onDelete,
    }: {
      onSave: (data: unknown) => void;
      onDelete?: () => void;
    }) => (
      <View testID="item-form-mock">
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
    fireEvent.press(screen.getByTestId('item-form-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
  });
});
