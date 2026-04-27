import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import ProfileSetupScreen from '../profile';

const mockPush = jest.fn();
const mockMutateAsync = jest.fn();

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
  useUpdateProfile: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

describe('ProfileSetupScreen (onboarding)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it('saves the trimmed display name and navigates when Continue is pressed', async () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Continue'));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ displayName: 'River Rider' });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
    });
  });

  it('navigates without saving when Skip is pressed', () => {
    const { getByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Skip for now'));
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
  });

  it('does not save when display name is blank', async () => {
    const { getByText, getByDisplayValue } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.changeText(getByDisplayValue('River Rider'), '   ');
    fireEvent.press(getByText('Continue'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/location');
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows an error and does not navigate when the save fails', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { getByText, findByText } = renderWithProviders(<ProfileSetupScreen />);
    fireEvent.press(getByText('Continue'));
    expect(await findByText("Couldn't save your profile. Please try again.")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows onboarding title and seeded display name', () => {
    const { getByText, getByDisplayValue } = renderWithProviders(<ProfileSetupScreen />);
    expect(getByText('Set up your profile')).toBeTruthy();
    expect(getByDisplayValue('River Rider')).toBeTruthy();
  });
});
