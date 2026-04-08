import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/shared/api/supabase';
import { signInWithOAuthProvider } from './signInWithOAuthProvider';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'bike-bin://auth/callback'),
}));

const mockSignInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;
const mockSetSession = supabase.auth.setSession as jest.Mock;
const mockOpenAuthSession = WebBrowser.openAuthSessionAsync as jest.Mock;

describe('signInWithOAuthProvider', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    (Platform as { OS: typeof originalOs }).OS = originalOs;
    jest.clearAllMocks();
  });

  it('on web, calls signInWithOAuth without skipBrowserRedirect', async () => {
    (Platform as { OS: typeof originalOs }).OS = 'web';
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await signInWithOAuthProvider('google');

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({ provider: 'google' });
    expect(mockOpenAuthSession).not.toHaveBeenCalled();
  });

  it('on native, opens auth session and sets session when tokens are returned', async () => {
    (Platform as { OS: typeof originalOs }).OS = 'ios';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://example.test/oauth' },
      error: null,
    });
    mockOpenAuthSession.mockResolvedValue({
      type: 'success',
      url: 'bike-bin://auth/callback#access_token=at&refresh_token=rt',
    });
    mockSetSession.mockResolvedValue({ data: { session: {} }, error: null });

    await signInWithOAuthProvider('google');

    expect(makeRedirectUri).toHaveBeenCalledWith({ path: 'auth/callback' });
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'bike-bin://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    expect(mockOpenAuthSession).toHaveBeenCalledWith(
      'https://example.test/oauth',
      'bike-bin://auth/callback',
    );
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'at',
      refresh_token: 'rt',
    });
  });

  it('on native, does not set session when the user dismisses the browser', async () => {
    (Platform as { OS: typeof originalOs }).OS = 'android';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://example.test/oauth' },
      error: null,
    });
    mockOpenAuthSession.mockResolvedValue({ type: 'cancel' });

    await signInWithOAuthProvider('apple');

    expect(mockSetSession).not.toHaveBeenCalled();
  });
});
