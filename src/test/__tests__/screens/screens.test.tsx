import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import InventoryScreen from '../../../../app/(tabs)/inventory/index';
import SearchScreen from '../../../../app/(tabs)/search/index';
import MessagesScreen from '../../../../app/(tabs)/messages/index';
import ProfileScreen from '../../../../app/(tabs)/profile/index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

describe('Tab screens render visible content', () => {
  it('Inventory screen shows heading', () => {
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByText('Inventory')).toBeVisible();
  });

  it('Search screen shows heading', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByText('Search')).toBeVisible();
  });

  it('Messages screen shows heading', () => {
    renderWithProviders(<MessagesScreen />);
    expect(screen.getByText('Messages')).toBeVisible();
  });

  it('Profile screen shows heading', () => {
    renderWithProviders(<ProfileScreen />);
    expect(screen.getByText('Profile')).toBeVisible();
  });
});
