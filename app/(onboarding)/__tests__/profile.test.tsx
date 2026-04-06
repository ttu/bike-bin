import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import ProfileSetupScreen from '../profile';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { user_metadata: { full_name: 'River Rider' } },
  }),
}));

describe('ProfileSetupScreen (onboarding)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to location step when Continue is pressed', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Continue'));
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });

  it('navigates to location step when Skip is pressed', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Skip for now'));
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });

  it('shows onboarding title and seeded display name', () => {
    const { getByText, getByDisplayValue } = renderWithProviders(<ProfileSetupScreen />);
    expect(getByText('Set up your profile')).toBeTruthy();
    expect(getByDisplayValue('River Rider')).toBeTruthy();
  });
});
