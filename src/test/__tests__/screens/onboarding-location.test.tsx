import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import LocationSetupScreen from '../../../../app/(onboarding)/location';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', user_metadata: { full_name: 'Test User' } },
    isAuthenticated: true,
    session: null,
    isLoading: false,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signOut: jest.fn(),
  }),
}));

const mockMutateAsync = jest.fn();
const mockGeocodePostcode = jest.fn();
jest.mock('@/features/locations', () => ({
  useCreateLocation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  geocodePostcode: (...args: unknown[]) => mockGeocodePostcode(...args),
  GeocodeError: class GeocodeError extends Error {},
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

  it('Done navigates to main app when postcode is empty', () => {
    const { getByText } = renderWithProviders(<LocationSetupScreen />);
    fireEvent.press(getByText('Done'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('Skip navigates to main app', () => {
    const { getByText } = renderWithProviders(<LocationSetupScreen />);
    fireEvent.press(getByText('Skip for now'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('shows geocode error when postcode lookup fails on blur', async () => {
    mockGeocodePostcode.mockRejectedValue(new Error('fail'));
    const { getByPlaceholderText, getByText } = renderWithProviders(<LocationSetupScreen />);
    const postcodeInput = getByPlaceholderText('Enter your postcode');
    fireEvent.changeText(postcodeInput, 'INVALID');
    fireEvent(postcodeInput, 'blur');

    await waitFor(() => {
      expect(getByText('Could not find that postcode. Please check and try again.')).toBeTruthy();
    });
  });
});
