import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import InventoryScreen from '../../../../app/(tabs)/inventory/index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

describe('InventoryScreen', () => {
  it('renders the inventory heading', () => {
    renderWithProviders(<InventoryScreen />);
    expect(screen.getByText('Inventory')).toBeTruthy();
  });
});
