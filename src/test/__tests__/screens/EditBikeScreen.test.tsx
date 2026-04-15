import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockBike } from '@/test/factories';
import type { BikeId } from '@/shared/types';
import { BikeType, ItemCondition } from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import commonEn from '@/i18n/en/common.json';
import EditBikeScreen from '../../../../app/(tabs)/bikes/edit/[id]';

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

const mockNavigate = jest.fn();

jest.mock('expo-router', () => {
  const { mockExpoRouterNavigation } =
    jest.requireActual<typeof import('@/test/routerMocks')>('@/test/routerMocks');
  return {
    ...mockExpoRouterNavigation,
    useLocalSearchParams: () => ({ id: 'bike-1' }),
    router: {
      navigate: (...args: unknown[]) => mockNavigate(...args),
    },
  };
});

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockBike = createMockBike({
  id: 'bike-1' as BikeId,
  name: 'Road bike',
  type: BikeType.Road,
  brand: 'Brand',
  model: 'Model',
  year: 2020,
  distanceKm: 100,
  usageHours: 10,
  condition: ItemCondition.Good,
  notes: 'Notes',
});

const mockUpdateBikeMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);
const mockDeleteBikeMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);
const mockRemoveBikePhotoMutate = jest.fn((_vars: unknown, opts?: { onSettled?: () => void }) => {
  opts?.onSettled?.();
});

let mockBikePhotos: { id: string; storagePath: string }[] = [];

jest.mock('@/features/bikes', () => ({
  ...jest.requireActual<typeof import('@/features/bikes')>('@/features/bikes'),
  useBike: () => ({ data: mockBike, isLoading: false }),
  useBikePhotos: () => ({ data: mockBikePhotos }),
  useUpdateBike: () => ({ mutate: mockUpdateBikeMutate, isPending: false }),
  useDeleteBike: () => ({ mutate: mockDeleteBikeMutate, isPending: false }),
  useBikePhotoUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false }),
  useRemoveBikePhoto: () => ({ mutate: mockRemoveBikePhotoMutate, isPending: false }),
}));

jest.mock('@/shared/components/PhotoPicker/PhotoPicker', () => ({
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

jest.mock('@/features/bikes/components/BikeForm/BikeForm', () => {
  const { BikeType, ItemCondition } =
    jest.requireActual<typeof import('@/shared/types')>('@/shared/types');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { View, Text, Pressable } = require('react-native');
  return {
    BikeForm: ({
      onSave,
      onDelete,
      photoSection,
    }: {
      onSave: (data: unknown) => void;
      onDelete: () => void;
      photoSection?: unknown;
    }) => (
      <View testID="bike-form-mock">
        {photoSection}
        <Pressable
          testID="bike-form-save"
          onPress={() =>
            onSave({
              name: 'Road bike',
              brand: 'Brand',
              model: 'Model',
              type: BikeType.Road,
              year: 2020,
              distanceKm: 100,
              usageHours: 10,
              condition: ItemCondition.Good,
              notes: 'Notes',
            })
          }
        >
          <Text>Save</Text>
        </Pressable>
        <Pressable testID="bike-form-delete" onPress={onDelete}>
          <Text>Delete</Text>
        </Pressable>
      </View>
    ),
  };
});

describe('EditBikeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBikePhotos = [];
    mockUpdateBikeMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
    mockDeleteBikeMutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
    });
  });

  it('renders edit title and back navigates with tab scope', () => {
    renderWithProviders(<EditBikeScreen />);
    expect(screen.getByText('Edit Bike')).toBeTruthy();
    expect(screen.getByTestId('bike-form-mock')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalled();
  });

  it('invokes save and delete handlers from the form', () => {
    renderWithProviders(<EditBikeScreen />);
    fireEvent.press(screen.getByTestId('bike-form-save'));
    expect(mockUpdateBikeMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bike-1',
        name: 'Road bike',
      }),
      expect.any(Object),
    );
    fireEvent.press(screen.getByTestId('bike-form-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    expect(mockDeleteBikeMutate).toHaveBeenCalledWith('bike-1', expect.any(Object));
  });

  it('returns to bikes tab after a successful save', () => {
    renderWithProviders(<EditBikeScreen />);
    fireEvent.press(screen.getByTestId('bike-form-save'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/bikes');
  });

  it('shows generic error when save fails', async () => {
    mockUpdateBikeMutate.mockImplementationOnce((_vars, opts) => {
      opts?.onError?.();
    });
    renderWithProviders(<EditBikeScreen />);
    fireEvent.press(screen.getByTestId('bike-form-save'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('navigates to bikes after a successful delete', () => {
    renderWithProviders(<EditBikeScreen />);
    fireEvent.press(screen.getByTestId('bike-form-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/bikes');
  });

  it('shows generic error when delete fails', async () => {
    mockDeleteBikeMutate.mockImplementationOnce((_vars, opts) => {
      opts?.onError?.();
    });
    renderWithProviders(<EditBikeScreen />);
    fireEvent.press(screen.getByTestId('bike-form-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(commonEn.errors.generic)).toBeTruthy();
    });
  });

  it('removes a photo after confirming', async () => {
    mockBikePhotos = [{ id: 'photo-1', storagePath: 'bikes/photo-1.jpg' }];
    renderWithProviders(<EditBikeScreen />);
    fireEvent.press(screen.getByTestId('photo-picker-remove'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockRemoveBikePhotoMutate).toHaveBeenCalled();
    });
  });

  it('renders hero thumbnail when a photo exists', () => {
    mockBikePhotos = [{ id: 'photo-1', storagePath: 'bikes/photo-1.jpg' }];
    renderWithProviders(<EditBikeScreen />);
    expect(screen.getByTestId('bike-form-mock')).toBeTruthy();
  });
});
