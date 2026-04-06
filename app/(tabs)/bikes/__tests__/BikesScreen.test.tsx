import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockBike } from '@/test/factories';
import { BikeType } from '@/shared/types';
import type { BikeId } from '@/shared/types';
import BikesScreen from '../index';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

const mockRouterPush = jest.fn();
const mockUseBikes = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
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

jest.mock('@/features/bikes', () => ({
  useBikes: () => mockUseBikes(),
  useBikeRowCapacity: () => ({ atLimit: false, bikeRowCount: 0, limit: undefined, isReady: true }),
}));

describe('BikesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state and navigates to new bike from CTA', () => {
    mockUseBikes.mockReturnValue({ data: [], isLoading: false });
    const { getByText } = renderWithProviders(<BikesScreen />);
    expect(getByText('No bikes yet')).toBeTruthy();
    fireEvent.press(getByText('Add Bike'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/bikes/new');
  });

  it('renders bike list and opens detail on card press', () => {
    const bike = createMockBike({
      id: 'bike-xyz' as BikeId,
      name: 'Test Bike',
      brand: 'Brand',
      model: 'Model',
      type: BikeType.Road,
      year: 2023,
    });
    mockUseBikes.mockReturnValue({ data: [bike], isLoading: false });
    const { getByText } = renderWithProviders(<BikesScreen />);
    fireEvent.press(getByText('Test Bike'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/bikes/bike-xyz');
  });

  it('shows FAB to add bike when list is non-empty', () => {
    const bike = createMockBike({
      id: 'bike-a' as BikeId,
      name: 'Only Bike',
      brand: 'B',
      model: 'M',
      type: BikeType.MTB,
      year: 2022,
    });
    mockUseBikes.mockReturnValue({ data: [bike], isLoading: false });
    const { getByLabelText } = renderWithProviders(<BikesScreen />);
    fireEvent.press(getByLabelText('Add Bike'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/bikes/new');
  });
});
