import React from 'react';
import { renderWithProviders } from '@/test/utils';
import { act, waitFor } from '@testing-library/react-native';
import NewItemScreen from '../new';

const mockMutateAsync = jest.fn();
const mockUploadAll = jest.fn();
const mockAddItem = jest.fn();
const mockRouterPush = jest.fn();
const mockTabScopedBack = jest.fn();
const mockPickPhoto = jest.fn();
const mockAddStaged = jest.fn();
let mockIsAuthenticated = true;
let mockIsInventoryLimitError = false;
let mockIsPhotoLimitError = false;
let mockStagedPhotos: { uri: string; fileName: string }[] = [];
let mockAtLimit = false;
let mockLimit: number | undefined;
let capturedOnSave: ((data: Record<string, unknown>) => void) | undefined;

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
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: (...args: unknown[]) => mockTabScopedBack(...args),
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: mockIsAuthenticated,
  }),
}));

jest.mock('@/features/inventory', () => ({
  useCreateItem: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useInventoryRowCapacity: () => ({
    atLimit: mockAtLimit,
    itemRowCount: 0,
    limit: mockLimit,
    isReady: true,
  }),
  isInventoryLimitExceededError: () => mockIsInventoryLimitError,
  isPhotoLimitExceededError: () => mockIsPhotoLimitError,
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
  useLocalInventory: () => ({ addItem: mockAddItem }),
}));

jest.mock('@/features/inventory/hooks/usePhotoPicker', () => ({
  usePhotoPicker: () => ({ pickPhoto: mockPickPhoto, isPicking: false }),
}));

jest.mock('@/features/inventory/hooks/useStagedPhotos', () => ({
  useStagedPhotos: () => ({
    stagedPhotos: mockStagedPhotos,
    addStaged: mockAddStaged,
    removeStaged: jest.fn(),
    uploadAll: mockUploadAll,
    isUploading: false,
  }),
}));

jest.mock('@/features/inventory/components/ItemForm/ItemForm', () => ({
  ItemForm: (props: { onSave: (data: Record<string, unknown>) => void }) => {
    capturedOnSave = props.onSave;
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

const formData = { name: 'Test Item', category: 'component', condition: 'good' };

beforeEach(() => {
  jest.clearAllMocks();
  capturedOnSave = undefined;
  mockIsAuthenticated = true;
  mockIsInventoryLimitError = false;
  mockIsPhotoLimitError = false;
  mockStagedPhotos = [];
  mockAtLimit = false;
  mockLimit = undefined;
});

describe('NewItemScreen', () => {
  it('renders app bar title and item form', () => {
    const { getByText, getByTestId } = renderWithProviders(<NewItemScreen />);
    expect(getByText('Add item')).toBeTruthy();
    expect(getByTestId('item-form-placeholder')).toBeTruthy();
  });

  it('creates item and navigates back on successful save', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'item-1' });
    renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith(formData);
    expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('shows limit snackbar when inventory limit is exceeded', async () => {
    mockIsInventoryLimitError = true;
    mockMutateAsync.mockRejectedValue(new Error('limit'));
    const { getByText } = renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockTabScopedBack).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Could not save — inventory limit reached.')).toBeTruthy();
    });
  });

  it('shows error snackbar on unexpected createItem error', async () => {
    mockMutateAsync.mockRejectedValue(new Error('network'));
    const { getByText } = renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockTabScopedBack).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Something went wrong while saving. Please try again.')).toBeTruthy();
    });
  });

  it('navigates to detail with photoLimitWarning on photo limit error', async () => {
    mockIsPhotoLimitError = true;
    mockStagedPhotos = [{ uri: 'file://photo.jpg', fileName: 'photo.jpg' }];
    mockMutateAsync.mockResolvedValue({ id: 'item-1' });
    mockUploadAll.mockRejectedValue(new Error('photo limit'));
    renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/inventory/item-1?photoLimitWarning=1');
    expect(mockTabScopedBack).not.toHaveBeenCalled();
  });

  it('shows error snackbar on unexpected photo upload error', async () => {
    mockStagedPhotos = [{ uri: 'file://photo.jpg', fileName: 'photo.jpg' }];
    mockMutateAsync.mockResolvedValue({ id: 'item-1' });
    mockUploadAll.mockRejectedValue(new Error('network'));
    const { getByText } = renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockTabScopedBack).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Something went wrong while saving. Please try again.')).toBeTruthy();
    });
  });

  it('uses local storage when not authenticated', async () => {
    mockIsAuthenticated = false;
    mockAddItem.mockResolvedValue(undefined);
    renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockAddItem).toHaveBeenCalled();
    expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('uploads photos after creating item when staged photos exist', async () => {
    mockStagedPhotos = [{ uri: 'file://photo.jpg', fileName: 'photo.jpg' }];
    mockMutateAsync.mockResolvedValue({ id: 'item-1' });
    mockUploadAll.mockResolvedValue(undefined);
    renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockUploadAll).toHaveBeenCalledWith('item-1');
    expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/inventory');
  });
});
