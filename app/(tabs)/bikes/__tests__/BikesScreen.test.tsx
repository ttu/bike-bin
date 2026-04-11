import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockBike } from '@/test/factories';
import { BikeType } from '@/shared/types';
import type { BikeId } from '@/shared/types';
import bikesEn from '@/i18n/en/bikes.json';
import commonEn from '@/i18n/en/common.json';
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

const mockBikeCapacityState = {
  atLimit: false,
  limit: undefined as number | undefined,
  bikeRowCount: 0,
  isReady: true,
};

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
  useBikeRowCapacity: () => ({
    atLimit: mockBikeCapacityState.atLimit,
    bikeRowCount: mockBikeCapacityState.bikeRowCount,
    limit: mockBikeCapacityState.limit,
    isReady: mockBikeCapacityState.isReady,
  }),
}));

describe('BikesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBikeCapacityState.atLimit = false;
    mockBikeCapacityState.limit = undefined;
    mockBikeCapacityState.bikeRowCount = 0;
    mockBikeCapacityState.isReady = true;
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

  it('shows centered loading when empty and loading even at capacity limit', () => {
    mockBikeCapacityState.atLimit = true;
    mockBikeCapacityState.limit = 2;
    mockBikeCapacityState.bikeRowCount = 2;
    mockUseBikes.mockReturnValue({ data: [], isLoading: true });
    const { getByLabelText, queryByLabelText } = renderWithProviders(<BikesScreen />);
    expect(getByLabelText(commonEn.loading.a11y)).toBeTruthy();
    expect(queryByLabelText(bikesEn.limit.reachedFabA11y)).toBeNull();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('does not navigate when add is pressed at bike limit', () => {
    mockBikeCapacityState.atLimit = true;
    mockBikeCapacityState.limit = 2;
    mockBikeCapacityState.bikeRowCount = 2;
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
    fireEvent.press(getByLabelText(bikesEn.limit.reachedFabA11y));
    expect(mockRouterPush).not.toHaveBeenCalled();
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
