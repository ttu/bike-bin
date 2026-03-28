import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockLocation } from '@/test/factories';
import { LocationCard } from '../LocationCard';

describe('LocationCard', () => {
  it('renders location label and area name', () => {
    const location = createMockLocation({ label: 'Home', areaName: 'Berlin Mitte' });

    renderWithProviders(<LocationCard location={location} />);

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Berlin Mitte')).toBeTruthy();
  });

  it('renders postcode when available', () => {
    const location = createMockLocation({ postcode: '10115' });

    renderWithProviders(<LocationCard location={location} />);

    expect(screen.getByText('10115')).toBeTruthy();
  });

  it('shows primary badge for primary location', () => {
    const location = createMockLocation({ isPrimary: true });

    renderWithProviders(<LocationCard location={location} />);

    expect(screen.getByText('Primary')).toBeTruthy();
  });

  it('does not show primary badge for non-primary location', () => {
    const location = createMockLocation({ isPrimary: false });

    renderWithProviders(<LocationCard location={location} />);

    expect(screen.queryByText('Primary')).toBeNull();
  });

  it('handles press event', () => {
    const location = createMockLocation();
    const onPress = jest.fn();

    renderWithProviders(<LocationCard location={location} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: location.label }));
    expect(onPress).toHaveBeenCalledWith(location);
  });

  it('invokes onDelete and onPress on separate targets when both are provided', () => {
    const location = createMockLocation({ isPrimary: false, label: 'Workshop' });
    const onPress = jest.fn();
    const onDelete = jest.fn();

    renderWithProviders(<LocationCard location={location} onPress={onPress} onDelete={onDelete} />);

    fireEvent.press(screen.getByRole('button', { name: 'Delete location' }));
    expect(onDelete).toHaveBeenCalledWith(location);
    expect(onPress).not.toHaveBeenCalled();

    onDelete.mockClear();
    fireEvent.press(screen.getByRole('button', { name: 'Workshop' }));
    expect(onPress).toHaveBeenCalledWith(location);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('handles missing area name gracefully', () => {
    const location = createMockLocation({ areaName: undefined });

    renderWithProviders(<LocationCard location={location} />);

    expect(screen.getByText(location.label)).toBeTruthy();
  });

  it('sets accessible label with primary indicator', () => {
    const location = createMockLocation({ label: 'Home', isPrimary: true });

    renderWithProviders(<LocationCard location={location} />);

    expect(screen.getByRole('button', { name: 'Home, Primary' })).toBeTruthy();
  });
});
