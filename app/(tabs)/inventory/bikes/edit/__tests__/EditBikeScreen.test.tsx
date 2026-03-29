import { Alert } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockBike } from '@/test/factories';
import { BikeType } from '@/shared/types';
import type { BikeId } from '@/shared/types';
import EditBikeScreen from '../../edit/[id]';

const mockRouterNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'bike-123' }),
  router: {
    navigate: (...args: unknown[]) => mockRouterNavigate(...args),
    canDismiss: () => true,
    dismiss: jest.fn(),
    replace: jest.fn(),
  },
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

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

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

jest.spyOn(Alert, 'alert');

describe('EditBikeScreen confirmations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows confirmation before deleting bike', () => {
    const { getByText } = renderWithProviders(<EditBikeScreen />);

    fireEvent.press(getByText('Delete Bike'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Bike',
      'Are you sure you want to delete this bike? This cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ]),
    );
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('deletes bike when confirmation is accepted', () => {
    const { getByText } = renderWithProviders(<EditBikeScreen />);

    fireEvent.press(getByText('Delete Bike'));

    const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2].find(
      (btn: { text: string }) => btn.text === 'Delete',
    );
    confirmButton.onPress();

    expect(mockDeleteMutate).toHaveBeenCalledWith('bike-123', expect.any(Object));
  });
});
