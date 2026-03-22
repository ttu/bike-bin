import * as RN from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockBike } from '@/test/factories';
import { BikeType } from '@/shared/types';
import type { BikeId } from '@/shared/types';
import BikeDetailScreen from '../[id]';

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'bike-123' }),
  router: {
    back: (...args: unknown[]) => mockRouterBack(...args),
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  const mockInsetsContext = React.createContext(mockInsets);
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: mockInsetsContext,
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  },
}));

const mockBike = createMockBike({
  id: 'bike-123' as BikeId,
  name: 'Canyon Grail',
  brand: 'Canyon',
  model: 'Grail CF 7',
  type: BikeType.Gravel,
  year: 2024,
});

jest.mock('@/features/bikes', () => ({
  useBike: () => ({ data: mockBike, isLoading: false }),
  useBikePhotos: () => ({ data: [] }),
}));

describe('BikeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders back button that calls router.back', () => {
    const { getByLabelText } = renderWithProviders(<BikeDetailScreen />);
    const backButton = getByLabelText('Back');
    fireEvent.press(backButton);
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it('renders edit button that navigates to edit screen', () => {
    const { getAllByRole } = renderWithProviders(<BikeDetailScreen />);
    const buttons = getAllByRole('button');
    // The second icon button in the appbar is the edit (pencil) button
    // First is back, second is pencil
    const editButton = buttons[1];
    fireEvent.press(editButton);
    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('edit/bike-123'));
  });

  it('renders bike name', () => {
    const { getByText } = renderWithProviders(<BikeDetailScreen />);
    expect(getByText('Canyon Grail')).toBeTruthy();
  });

  it('renders side-by-side layout on wide screens', () => {
    jest
      .spyOn(RN, 'useWindowDimensions')
      .mockReturnValue({ width: 1024, height: 768, scale: 1, fontScale: 1 });
    const { getByText } = renderWithProviders(<BikeDetailScreen />);
    expect(getByText('Canyon Grail')).toBeTruthy();
    expect(getByText('No photos')).toBeTruthy();
  });
});
