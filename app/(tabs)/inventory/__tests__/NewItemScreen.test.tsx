import React from 'react';
import { renderWithProviders } from '@/test/utils';
import NewItemScreen from '../new';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  router: { push: jest.fn() },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

jest.mock('@/features/inventory', () => ({
  useCreateItem: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useInventoryRowCapacity: () => ({
    atLimit: false,
    itemRowCount: 0,
    limit: undefined,
    isReady: true,
  }),
  isInventoryLimitExceededError: () => false,
  isPhotoLimitExceededError: () => false,
}));

jest.mock('@/shared/hooks/usePhotoRowCapacity', () => ({
  usePhotoRowCapacity: () => ({
    atLimit: false,
    photoRowCount: 0,
    limit: undefined,
    isReady: true,
  }),
}));

jest.mock('@/features/inventory/hooks/useLocalInventory', () => ({
  useLocalInventory: () => ({ addItem: jest.fn() }),
}));

jest.mock('@/features/inventory/hooks/usePhotoPicker', () => ({
  usePhotoPicker: () => ({ pickPhoto: jest.fn(), isPicking: false }),
}));

jest.mock('@/features/inventory/hooks/useStagedPhotos', () => ({
  useStagedPhotos: () => ({
    stagedPhotos: [],
    addStaged: jest.fn(),
    removeStaged: jest.fn(),
    uploadAll: jest.fn(),
    isUploading: false,
  }),
}));

jest.mock('@/features/inventory/components/ItemForm/ItemForm', () => ({
  ItemForm: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text testID="item-form-placeholder">ItemForm</Text>;
  },
}));

jest.mock('@/features/inventory/components/PhotoPicker/PhotoPicker', () => ({
  PhotoPicker: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text testID="photo-picker-placeholder">PhotoPicker</Text>;
  },
}));

describe('NewItemScreen', () => {
  it('renders app bar title and item form', () => {
    const { getByText, getByTestId } = renderWithProviders(<NewItemScreen />);
    expect(getByText('Add item')).toBeTruthy();
    expect(getByTestId('item-form-placeholder')).toBeTruthy();
  });
});
