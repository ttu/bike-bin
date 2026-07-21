import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { TEST_USER_PASSWORD, MAIN_TEST_USER } from '@/shared/constants/testUsers';
import { LoginActionPanel } from './LoginActionPanel';

const mockSignInWithPassword = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@/shared/utils/env', () => ({
  isPasswordDemoLoginEnabled: true,
}));

const noop = () => {};

function renderPanel() {
  return renderWithProviders(
    <LoginActionPanel
      onSignInWithApple={noop}
      onSignInWithGoogle={noop}
      onBrowseWithout={noop}
      onTryDemo={noop}
    />,
  );
}

describe('LoginActionPanel dev login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ error: null });
  });

  it('signs in as the main test user and navigates to inventory', async () => {
    const { getByText } = renderPanel();

    fireEvent.press(getByText('Dev Login'));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: MAIN_TEST_USER.email,
        password: TEST_USER_PASSWORD,
      });
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
    });
  });

  it('stays on the screen when dev sign-in fails', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = renderPanel();

    fireEvent.press(getByText('Dev Login'));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('reveals the other test users only after expanding', async () => {
    const { getByText, queryByText } = renderPanel();

    expect(queryByText(/Marcus B\./)).toBeNull();

    fireEvent.press(getByText('Other test users'));

    await waitFor(() => {
      expect(getByText(/Marcus B\./)).toBeTruthy();
    });
  });
});
