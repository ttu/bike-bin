import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockLocation } from '@/test/factories';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import SavedLocationsScreen from '../../../../app/(tabs)/profile/locations';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
  },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockRefetch = jest.fn();
let mockLocations = [createMockLocation()];

jest.mock('@/features/locations', () => ({
  ...jest.requireActual<typeof import('@/features/locations')>('@/features/locations'),
  useLocations: () => ({ data: mockLocations, isLoading: false, refetch: mockRefetch }),
  useCreateLocation: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateLocation: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteLocation: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/features/locations/components/LocationCard/LocationCard', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { Text, Pressable } = require('react-native');
  return {
    LocationCard: ({
      location,
      onPress,
    }: {
      location: { label: string };
      onPress: (loc: { label: string }) => void;
    }) => (
      <Pressable onPress={() => onPress(location)}>
        <Text>{location.label}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/features/locations/components/LocationForm/LocationForm', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { View, Text, Pressable } = require('react-native');
  return {
    LocationForm: ({ onCancel }: { onCancel: () => void }) => (
      <View testID="location-form-mock">
        <Pressable testID="location-form-cancel" onPress={onCancel}>
          <Text>Cancel form</Text>
        </Pressable>
      </View>
    ),
  };
});

describe('SavedLocationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocations = [createMockLocation()];
  });

  it('shows list title and navigates back', () => {
    renderWithProviders(<SavedLocationsScreen />);
    expect(screen.getByText('Saved Locations')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('opens add flow from FAB', () => {
    renderWithProviders(<SavedLocationsScreen />);
    fireEvent.press(screen.getByTestId('fab'));
    expect(screen.getByTestId('location-form-mock')).toBeTruthy();
    fireEvent.press(screen.getByTestId('location-form-cancel'));
    expect(screen.getByText('Saved Locations')).toBeTruthy();
  });
});
