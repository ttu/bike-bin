import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import ProfileSetupScreen from '../../../../app/(onboarding)/profile';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock('@/features/profile', () => ({
  useUpdateProfile: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { user_metadata: { full_name: 'Test User' } },
    isAuthenticated: true,
    session: null,
    isLoading: false,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signOut: jest.fn(),
  }),
}));

describe('Profile setup screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders progress dots (step 1 of 2)', () => {
    const { getByLabelText } = renderWithProviders(<ProfileSetupScreen />);
    expect(getByLabelText('Step 1 of 2')).toBeTruthy();
  });

  it('renders title', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    expect(getByText('Set up your profile')).toBeTruthy();
  });

  it('renders photo upload area', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    expect(getByText('Add a photo')).toBeTruthy();
  });

  it('renders display name input pre-filled from OAuth', () => {
    const { getByDisplayValue } = renderWithProviders(<ProfileSetupScreen />);
    expect(getByDisplayValue('Test User')).toBeTruthy();
  });

  it('Skip navigates to location step', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Skip for now'));
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });

  it('Continue navigates to location step', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Continue'));
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });
});
