import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockBike } from '@/test/factories';
import { mockAuthModule } from '@/test/authMocks';
import { BikeType } from '@/shared/types';
import type { BikeId } from '@/shared/types';
import EditBikeScreen from '../[id]';

const mockRouterNavigate = jest.fn();

jest.mock('expo-router', () => {
  const { mockExpoRouterNavigation } =
    jest.requireActual<typeof import('@/test/routerMocks')>('@/test/routerMocks');
  return {
    ...mockExpoRouterNavigation,
    useLocalSearchParams: () => ({ id: 'bike-123' }),
    router: {
      navigate: (...args: unknown[]) => mockRouterNavigate(...args),
      canDismiss: () => true,
      dismiss: jest.fn(),
      replace: jest.fn(),
    },
  };
});

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

jest.mock('@/features/auth', () => mockAuthModule);

const mockDeleteMutate = jest.fn();

const mockBike = createMockBike({
  id: 'bike-123' as BikeId,
  name: 'Canyon Grail',
  brand: 'Canyon',
  model: 'Grail CF 7',
  type: BikeType.Gravel,
  year: 2024,
});

jest.mock('@/features/bikes', () => ({
  useBike: () => ({ data: mockBike }),
  useBikePhotos: () => ({ data: [] }),
  useUpdateBike: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteBike: () => ({ mutate: mockDeleteMutate }),
  useBikePhotoUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false }),
  useSwapBikePhotoOrder: () => ({ mutate: jest.fn(), mutateAsync: jest.fn(), isPending: false }),
  useRemoveBikePhoto: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        remove: jest.fn().mockResolvedValue({}),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
    from: jest.fn(() => ({
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
  };
});

describe('EditBikeScreen confirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not show bike id label in the hero header', () => {
    renderWithProviders(<EditBikeScreen />);

    expect(screen.queryByText(/Bike ID:/)).toBeNull();
  });

  it('shows confirmation before deleting bike', () => {
    const { getByText, getByTestId } = renderWithProviders(<EditBikeScreen />);

    fireEvent.press(getByText('Delete Bike'));

    expect(getByTestId('confirm-dialog')).toBeTruthy();
    expect(getByTestId('confirm-dialog-confirm')).toBeTruthy();
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('deletes bike when confirmation is accepted', () => {
    const { getByText, getByTestId } = renderWithProviders(<EditBikeScreen />);

    fireEvent.press(getByText('Delete Bike'));
    fireEvent.press(getByTestId('confirm-dialog-confirm'));

    expect(mockDeleteMutate).toHaveBeenCalledWith('bike-123', expect.any(Object));
  });
});
