import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import LocationSetupScreen from '../../../../app/(onboarding)/location';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

describe('Location setup screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders progress dots (step 2 of 2)', () => {
    const { getByLabelText } = renderWithProviders(<LocationSetupScreen />);
    expect(getByLabelText('Step 2 of 2')).toBeTruthy();
  });

  it('renders title', () => {
    const { getByText } = renderWithProviders(<LocationSetupScreen />);
    expect(getByText('Add your location')).toBeTruthy();
  });

  it('renders postcode input', () => {
    const { getAllByText } = renderWithProviders(<LocationSetupScreen />);
    expect(getAllByText('Postcode / ZIP').length).toBeGreaterThan(0);
  });

  it('renders label input', () => {
    const { getAllByText } = renderWithProviders(<LocationSetupScreen />);
    // "Label" appears in the TextInput label - may render multiple times in Paper
    expect(getAllByText('Label').length).toBeGreaterThan(0);
  });

  it('renders privacy callout', () => {
    const { getByText } = renderWithProviders(<LocationSetupScreen />);
    expect(
      getByText('Only the area name is visible to others. Your exact address is never shared.'),
    ).toBeTruthy();
  });

  it('Done navigates to main app', () => {
    const { getByText } = renderWithProviders(<LocationSetupScreen />);
    fireEvent.press(getByText('Done'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('Skip navigates to main app', () => {
    const { getByText } = renderWithProviders(<LocationSetupScreen />);
    fireEvent.press(getByText('Skip for now'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });
});
