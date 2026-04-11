import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockBike } from '@/test/factories';
import type { BikeId } from '@/shared/types';
import { BikeType, ItemCondition } from '@/shared/types';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
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

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'bike-1' }),
  router: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  },
}));

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

jest.mock('@/features/bikes', () => ({
  ...jest.requireActual<typeof import('@/features/bikes')>('@/features/bikes'),
  useBike: () => ({ data: mockBike, isLoading: false }),
  useBikePhotos: () => ({ data: [] }),
  useUpdateBike: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteBike: () => ({ mutate: jest.fn(), isPending: false }),
  useBikePhotoUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false }),
  useRemoveBikePhoto: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/features/bikes/components/BikeForm/BikeForm', () => {
  const { BikeType, ItemCondition } =
    jest.requireActual<typeof import('@/shared/types')>('@/shared/types');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { View, Text, Pressable } = require('react-native');
  return {
    BikeForm: ({ onSave, onDelete }: { onSave: (data: unknown) => void; onDelete: () => void }) => (
      <View testID="bike-form-mock">
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
    fireEvent.press(screen.getByTestId('bike-form-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
  });
});
