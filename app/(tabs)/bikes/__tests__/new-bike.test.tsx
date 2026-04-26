import React from 'react';
import { renderWithProviders } from '@/test/utils';
import { act, waitFor } from '@testing-library/react-native';
import NewBikeScreen from '../new';
import { PhotoLimitExceededError } from '@/shared/utils/subscriptionLimitErrors';

const mockMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();
const mockUploadAll = jest.fn();
const mockRouterPush = jest.fn();
const mockTabScopedBack = jest.fn();
let mockStagedPhotos: { id: string; storagePath: string; localUri?: string }[] = [];
let mockAtLimit = false;
let mockPhotoAtLimit = false;
/** Mirrors usePhotoRowCapacity: row count vs subscription cap */
let mockPhotoRowCount = 0;
let mockPhotoLimitNum: number | undefined = 10_000;
let mockPhotoCapacityReady = true;
let mockLimit: number | undefined;
let capturedOnSave: ((data: Record<string, unknown>) => void | Promise<void>) | undefined;
let capturedOnValidationError: ((messages: string[]) => void) | undefined;
let capturedSubmitBlocked: string | undefined;

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
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: (...args: unknown[]) => mockTabScopedBack(...args),
}));

jest.mock('@/features/bikes', () => ({
  useCreateBike: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteBike: () => ({ mutateAsync: mockDeleteMutateAsync }),
  useBikeRowCapacity: () => ({
    atLimit: mockAtLimit,
    limit: mockLimit,
    isReady: true,
  }),
  useStagedBikePhotos: () => ({
    stagedPhotos: mockStagedPhotos,
    addStaged: jest.fn(),
    removeStaged: jest.fn(),
    uploadAll: mockUploadAll,
    isUploading: false,
  }),
}));

jest.mock('@/shared/hooks/usePhotoRowCapacity', () => ({
  usePhotoRowCapacity: () => ({
    atLimit: mockPhotoAtLimit,
    photoRowCount: mockPhotoRowCount,
    limit: mockPhotoLimitNum,
    isReady: mockPhotoCapacityReady,
  }),
}));

jest.mock('@/shared/hooks/usePhotoPicker', () => ({
  usePhotoPicker: () => ({ pickPhoto: jest.fn(), isPicking: false }),
}));

jest.mock('@/features/bikes/components/BikeForm/BikeForm', () => ({
  BikeForm: (props: {
    readonly onSave: (data: Record<string, unknown>) => void | Promise<void>;
    readonly onValidationError?: (messages: string[]) => void;
    readonly photoSection?: React.ReactNode;
    readonly submitBlockedMessage?: string;
  }) => {
    capturedOnSave = props.onSave;
    capturedOnValidationError = props.onValidationError;
    capturedSubmitBlocked = props.submitBlockedMessage;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text } = require('react-native');
    return (
      <View testID="bike-form-mock">
        {props.photoSection}
        <Text testID="bike-form-placeholder">BikeForm</Text>
      </View>
    );
  },
}));

jest.mock('@/shared/components/PhotoPicker/PhotoPicker', () => ({
  PhotoPicker: (props: Record<string, unknown>) => mockPhotoPicker(props),
}));

const formData = {
  name: 'Test Bike',
  type: 'road',
  condition: 'new',
};

beforeEach(() => {
  jest.clearAllMocks();
  capturedOnSave = undefined;
  capturedOnValidationError = undefined;
  capturedSubmitBlocked = undefined;
  mockStagedPhotos = [];
  mockAtLimit = false;
  mockPhotoAtLimit = false;
  mockPhotoRowCount = 0;
  mockPhotoLimitNum = 10_000;
  mockPhotoCapacityReady = true;
  mockLimit = undefined;
  mockPhotoPicker.mockClear();
});

describe('NewBikeScreen', () => {
  it('renders app bar title, bike form, and photo picker', () => {
    const { getByText, getByTestId } = renderWithProviders(<NewBikeScreen />);
    expect(getByText('Add Bike')).toBeTruthy();
    expect(getByTestId('bike-form-placeholder')).toBeTruthy();
    expect(mockPhotoPicker).toHaveBeenCalledWith(
      expect.objectContaining({ accountPhotoLimitReached: false }),
    );
  });

  it('passes accountPhotoLimitReached when photo row capacity is at limit', () => {
    mockPhotoAtLimit = true;
    mockPhotoRowCount = 100;
    mockPhotoLimitNum = 100;
    mockPhotoCapacityReady = true;
    renderWithProviders(<NewBikeScreen />);
    expect(mockPhotoPicker).toHaveBeenCalledWith(
      expect.objectContaining({ accountPhotoLimitReached: true }),
    );
  });

  it('does not pass accountPhotoLimitReached when photo capacity query is not ready', () => {
    mockPhotoAtLimit = true;
    mockPhotoCapacityReady = false;
    renderWithProviders(<NewBikeScreen />);
    expect(mockPhotoPicker).toHaveBeenCalledWith(
      expect.objectContaining({ accountPhotoLimitReached: false }),
    );
  });

  it('creates bike and navigates back on successful save', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'bike-1' });
    renderWithProviders(<NewBikeScreen />);

    await act(async () => {
      await capturedOnSave!(formData);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith(formData);
    expect(mockUploadAll).not.toHaveBeenCalled();
    expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/bikes');
  });

  it('uploads staged photos after create when present', async () => {
    mockStagedPhotos = [{ id: 's1', storagePath: '', localUri: 'file://p.jpg' }];
    mockMutateAsync.mockResolvedValue({ id: 'bike-1' });
    mockUploadAll.mockResolvedValue(undefined);
    renderWithProviders(<NewBikeScreen />);

    await act(async () => {
      await capturedOnSave!(formData);
    });

    expect(mockUploadAll).toHaveBeenCalledWith('bike-1');
    expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/bikes');
  });

  it('navigates to bike detail with photoLimitWarning on photo limit error', async () => {
    mockStagedPhotos = [{ id: 's1', storagePath: '', localUri: 'file://p.jpg' }];
    mockMutateAsync.mockResolvedValue({ id: 'bike-1' });
    mockUploadAll.mockRejectedValue(new PhotoLimitExceededError());
    renderWithProviders(<NewBikeScreen />);

    await act(async () => {
      await capturedOnSave!(formData);
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/bikes/bike-1?photoLimitWarning=1');
    expect(mockTabScopedBack).not.toHaveBeenCalled();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('deletes bike and shows error snackbar on non-photo upload failure', async () => {
    mockStagedPhotos = [{ id: 's1', storagePath: '', localUri: 'file://p.jpg' }];
    mockMutateAsync.mockResolvedValue({ id: 'bike-1' });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockUploadAll.mockRejectedValue(new Error('network'));
    const { getByText } = renderWithProviders(<NewBikeScreen />);

    await act(async () => {
      await capturedOnSave!(formData);
    });

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith('bike-1');
    expect(mockTabScopedBack).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Could not save. Try again.')).toBeTruthy();
    });
  });

  it('shows limit snackbar when bike limit is exceeded', async () => {
    const limitErr = Object.assign(new Error('limit'), {
      code: '23514',
      message: 'bike_limit_exceeded',
    });
    mockMutateAsync.mockRejectedValue(limitErr);
    const { getByText } = renderWithProviders(<NewBikeScreen />);

    await act(async () => {
      await capturedOnSave!(formData);
    });

    expect(mockTabScopedBack).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Could not save — bike limit reached.')).toBeTruthy();
    });
  });

  it('passes submitBlockedMessage when at bike row limit', () => {
    mockAtLimit = true;
    mockLimit = 3;
    renderWithProviders(<NewBikeScreen />);
    expect(capturedSubmitBlocked).toContain('3');
  });

  it('shows validation feedback snackbar when the form reports validation errors', async () => {
    const { getByText } = renderWithProviders(<NewBikeScreen />);

    await act(async () => {
      capturedOnValidationError!(['Validation message one']);
    });

    await waitFor(() => {
      expect(getByText('Validation message one')).toBeTruthy();
    });
  });
});
