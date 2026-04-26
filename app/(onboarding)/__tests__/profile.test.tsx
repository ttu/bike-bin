import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import ProfileSetupScreen from '../profile';

const mockPush = jest.fn();
const mockMutate = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', user_metadata: { full_name: 'River Rider' } },
  }),
}));

jest.mock('@/features/profile', () => ({
  useUpdateProfile: () => ({ mutate: mockMutate }),
}));

describe('ProfileSetupScreen (onboarding)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves the trimmed display name and navigates when Continue is pressed', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Continue'));
    expect(mockMutate).toHaveBeenCalledWith({ displayName: 'River Rider' });
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });

  it('navigates without saving when Skip is pressed', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Skip for now'));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });

  it('does not save when display name is blank', () => {
    const { getByText, getByDisplayValue } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.changeText(getByDisplayValue('River Rider'), '   ');
    fireEvent.press(getByText('Continue'));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });

  it('shows onboarding title and seeded display name', () => {
    const { getByText, getByDisplayValue } = renderWithProviders(<ProfileSetupScreen />);
    expect(getByText('Set up your profile')).toBeTruthy();
    expect(getByDisplayValue('River Rider')).toBeTruthy();
  });
});
