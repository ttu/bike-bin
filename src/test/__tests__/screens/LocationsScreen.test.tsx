import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockLocation } from '@/test/factories';
import { DeleteLocationError } from '@/features/locations/hooks/useDeleteLocation';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import commonEn from '@/i18n/en/common.json';
import locationsEn from '@/i18n/en/locations.json';
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

const mockCreateMutateAsync = jest.fn((_input?: unknown) => Promise.resolve());
const mockUpdateMutateAsync = jest.fn(() => Promise.resolve());
const mockDeleteMutateAsync = jest.fn(() => Promise.resolve());

jest.mock('@/features/locations', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const React = require('react');
  const actual = jest.requireActual<typeof import('@/features/locations')>('@/features/locations');
  return {
    ...actual,
    useLocations: () => ({ data: mockLocations, isLoading: false, refetch: mockRefetch }),
    useCreateLocation: () => {
      const [isPending, setIsPending] = React.useState(false);
      const mutateAsync = React.useCallback(async (input: unknown) => {
        setIsPending(true);
        try {
          return await mockCreateMutateAsync(input);
        } finally {
          setIsPending(false);
        }
      }, []);
      return { mutateAsync, isPending };
    },
    useUpdateLocation: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
    useDeleteLocation: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
  };
});

jest.mock('@/features/locations/components/LocationCard/LocationCard', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { Text, Pressable, View } = require('react-native');
  return {
    LocationCard: ({
      location,
      onPress,
      onDelete,
    }: {
      location: { label: string; id: string };
      onPress: (loc: { label: string; id: string }) => void;
      onDelete: (loc: { label: string; id: string }) => void;
    }) => (
      <View>
        <Pressable onPress={() => onPress(location)}>
          <Text>{location.label}</Text>
        </Pressable>
        <Pressable testID="location-delete" onPress={() => onDelete(location)}>
          <Text>Delete location</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('@/features/locations/components/LocationForm/LocationForm', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory runs in isolated scope
  const { View, Text, Pressable } = require('react-native');
  return {
    LocationForm: ({
      onCancel,
      onSave,
      isSubmitting,
    }: {
      onCancel: () => void;
      onSave: (data: unknown) => void | Promise<void>;
      isSubmitting?: boolean;
    }) => (
      <View testID="location-form-mock">
        <Pressable
          testID="location-form-submit"
          disabled={!!isSubmitting}
          accessibilityState={{ disabled: !!isSubmitting }}
          onPress={() =>
            void onSave({
              postcode: '12345',
              label: 'Home',
              isPrimary: true,
              geocoded: { areaName: 'Test', lat: 0, lng: 0 },
            })
          }
        >
          <Text>Save location</Text>
        </Pressable>
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
    mockCreateMutateAsync.mockImplementation(() => Promise.resolve());
    mockDeleteMutateAsync.mockImplementation(() => Promise.resolve());
  });

  it('shows list title and navigates back', () => {
    renderWithProviders(<SavedLocationsScreen />);
    expect(screen.getByText(locationsEn.title)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('opens add flow from FAB', () => {
    renderWithProviders(<SavedLocationsScreen />);
    fireEvent.press(screen.getByTestId('fab'));
    expect(screen.getByTestId('location-form-mock')).toBeTruthy();
    fireEvent.press(screen.getByTestId('location-form-cancel'));
    expect(screen.getByText(locationsEn.title)).toBeTruthy();
  });

  it('opens add flow from the list footer card', () => {
    renderWithProviders(<SavedLocationsScreen />);
    const addButtons = screen.getAllByLabelText(locationsEn.addLocation);
    fireEvent.press(addButtons[0]);
    expect(screen.getByTestId('location-form-mock')).toBeTruthy();
  });

  it('completes create flow and returns to list with success feedback', async () => {
    renderWithProviders(<SavedLocationsScreen />);
    fireEvent.press(screen.getByTestId('fab'));
    fireEvent.press(screen.getByTestId('location-form-submit'));
    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(commonEn.feedback.locationSaved)).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByText(locationsEn.title)).toBeTruthy();
    });
    expect(screen.queryByTestId('location-form-mock')).toBeNull();
  });

  it('disables submit while create location mutation is in flight', async () => {
    let resolveSave: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockCreateMutateAsync.mockImplementationOnce(() => pending);
    renderWithProviders(<SavedLocationsScreen />);
    fireEvent.press(screen.getByTestId('fab'));
    const submit = screen.getByTestId('location-form-submit');
    fireEvent.press(submit);
    await waitFor(() => {
      const el = screen.getByTestId('location-form-submit');
      expect(el.props.disabled === true || el.props.accessibilityState?.disabled === true).toBe(
        true,
      );
    });
    resolveSave?.();
    await waitFor(() => {
      expect(screen.getByText(locationsEn.title)).toBeTruthy();
    });
  });

  it('shows save failed when create rejects and keeps the form open', async () => {
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('save failed'));
    renderWithProviders(<SavedLocationsScreen />);
    fireEvent.press(screen.getByTestId('fab'));
    fireEvent.press(screen.getByTestId('location-form-submit'));
    await waitFor(() => {
      expect(screen.getByText(locationsEn.errors.saveFailed)).toBeTruthy();
    });
    expect(screen.getByTestId('location-form-mock')).toBeTruthy();
  });

  it('shows last-location error when delete is blocked', async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(
      new DeleteLocationError('blocked', 'LAST_LOCATION'),
    );
    renderWithProviders(<SavedLocationsScreen />);
    fireEvent.press(screen.getByTestId('location-delete'));
    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(screen.getByText(locationsEn.delete.lastLocation)).toBeTruthy();
    });
  });
});
