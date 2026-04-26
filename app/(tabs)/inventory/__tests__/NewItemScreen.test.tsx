import React from 'react';
import { renderWithProviders } from '@/test/utils';
import { act, waitFor } from '@testing-library/react-native';
import NewItemScreen from '../new';
import { AvailabilityType, Visibility, type GroupId } from '@/shared/types';

const mockMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();
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
let mockPhotoAtLimit = false;
let mockLimit: number | undefined;
let capturedOnSave: ((data: Record<string, unknown>) => void) | undefined;
let capturedOnValidationError: ((messages: string[]) => void) | undefined;
let capturedInitialData: Record<string, unknown> | undefined;
let mockSearchParams: Record<string, string | undefined> = {};

const mockPhotoPicker = jest.fn((_props: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return <Text testID="photo-picker-placeholder">PhotoPicker</Text>;
});

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
  useLocalSearchParams: () => mockSearchParams,
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
  useDeleteItem: () => ({ mutateAsync: mockDeleteMutateAsync }),
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
    atLimit: mockPhotoAtLimit,
    photoRowCount: 0,
    limit: undefined,
    isReady: true,
  }),
}));

jest.mock('@/features/inventory/hooks/useLocalInventory', () => ({
  useLocalInventory: () => ({ addItem: mockAddItem }),
}));

jest.mock('@/shared/hooks/usePhotoPicker', () => ({
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
  ItemForm: (props: {
    initialData?: Record<string, unknown>;
    onSave: (data: Record<string, unknown>) => void;
    onValidationError?: (messages: string[]) => void;
    photoSection?: React.ReactNode;
  }) => {
    capturedInitialData = props.initialData;
    capturedOnSave = props.onSave;
    capturedOnValidationError = props.onValidationError;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text } = require('react-native');
    return (
      <View testID="item-form-mock">
        {props.photoSection}
        <Text testID="item-form-placeholder">ItemForm</Text>
      </View>
    );
  },
}));

jest.mock('@/shared/components/PhotoPicker/PhotoPicker', () => ({
  PhotoPicker: (props: Record<string, unknown>) => mockPhotoPicker(props),
}));

const formData = { name: 'Test Item', category: 'component', condition: 'good' };

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = {};
  capturedOnSave = undefined;
  capturedOnValidationError = undefined;
  capturedInitialData = undefined;
  mockIsAuthenticated = true;
  mockIsInventoryLimitError = false;
  mockIsPhotoLimitError = false;
  mockStagedPhotos = [];
  mockAtLimit = false;
  mockPhotoAtLimit = false;
  mockLimit = undefined;
  mockPhotoPicker.mockClear();
});

describe('NewItemScreen', () => {
  it('renders app bar title and item form', () => {
    const { getByText, getByTestId } = renderWithProviders(<NewItemScreen />);
    expect(getByText('Add item')).toBeTruthy();
    expect(getByTestId('item-form-placeholder')).toBeTruthy();
    expect(capturedInitialData).toBeUndefined();
    expect(mockPhotoPicker).toHaveBeenCalledWith(
      expect.objectContaining({ accountPhotoLimitReached: false }),
    );
  });

  it('passes accountPhotoLimitReached true when authenticated and photo row capacity is at limit', () => {
    mockPhotoAtLimit = true;
    renderWithProviders(<NewItemScreen />);
    expect(mockPhotoPicker).toHaveBeenCalledWith(
      expect.objectContaining({ accountPhotoLimitReached: true }),
    );
  });

  it('passes accountPhotoLimitReached false when not authenticated even if photo capacity is at limit', () => {
    mockIsAuthenticated = false;
    mockPhotoAtLimit = true;
    renderWithProviders(<NewItemScreen />);
    expect(mockPhotoPicker).toHaveBeenCalledWith(
      expect.objectContaining({ accountPhotoLimitReached: false }),
    );
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
    mockMutateAsync.mockResolvedValue({ id: 'item-1', status: 'stored' });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockUploadAll.mockRejectedValue(new Error('network'));
    const { getByText } = renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnSave!(formData);
    });

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: 'item-1', status: 'stored' });
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

  it('shows validation feedback snackbar when the form reports validation errors', async () => {
    const { getByText } = renderWithProviders(<NewItemScreen />);

    await act(async () => {
      capturedOnValidationError!(['Item validation message']);
    });

    await waitFor(() => {
      expect(getByText('Item validation message')).toBeTruthy();
    });
  });

  it('passes group visibility initial data when groupId search param is set', () => {
    mockSearchParams = { groupId: 'group-abc' };
    renderWithProviders(<NewItemScreen />);
    expect(capturedInitialData).toEqual({
      name: '',
      availabilityTypes: [AvailabilityType.Private],
      groupIds: ['group-abc' as GroupId],
      visibility: Visibility.Groups,
    });
  });
});
