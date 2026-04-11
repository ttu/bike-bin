import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import type { LocationId, UserId } from '@/shared/types';
import SavedLocationsScreen from '../locations';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

const mockUseLocations = jest.fn();

jest.mock('@/features/locations', () => {
  const actual = jest.requireActual('@/features/locations');
  return {
    ...actual,
    useLocations: () => mockUseLocations(),
    useCreateLocation: () => ({ mutateAsync: jest.fn(), isPending: false }),
    useUpdateLocation: () => ({ mutateAsync: jest.fn(), isPending: false }),
    useDeleteLocation: () => ({ mutateAsync: jest.fn(), isPending: false }),
  };
});

describe('SavedLocationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocations.mockReturnValue({
      data: [
        {
          id: 'loc-1' as LocationId,
          userId: 'user-1' as UserId,
          label: 'Home',
          areaName: 'Test Area',
          postcode: 'SW1A 1AA',
          coordinates: { latitude: 51.5, longitude: -0.1 },
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  it('calls tabScopedBack when list back is pressed', () => {
    const { getByTestId } = renderWithProviders(<SavedLocationsScreen />);
    fireEvent.press(getByTestId('saved-locations-screen-back'));
    expect(jest.mocked(tabScopedBack)).toHaveBeenCalledWith('/(tabs)/profile');
  });
});
