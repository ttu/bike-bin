import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase } from '@/shared/api/supabase';

WebBrowser.maybeCompleteAuthSession();

function parseAuthCallbackParams(input: string): Record<string, string> {
  const url = new URL(input, 'https://phony.example');
  const params = Object.fromEntries(url.searchParams.entries());
  if (url.hash) {
    new URLSearchParams(url.hash.replace(/^#/, '')).forEach((value, key) => {
      params[key] = value;
    });
  }
  return params;
}

/**
 * Starts Google or Apple OAuth. Web relies on a full-page redirect and
 * `detectSessionInUrl` on the Supabase client. Native uses an in-app browser
 * and a deep link back into the app (see Supabase + Expo deep linking guide).
 */
export async function signInWithOAuthProvider(provider: 'google' | 'apple'): Promise<void> {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) throw error;
    return;
  }

  const redirectTo = makeRedirectUri({
    path: 'auth/callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  const authUrl = data.url;
  if (authUrl === undefined || authUrl === '') {
    throw new Error('OAuth URL missing');
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);

  if (result.type !== 'success') {
    return;
  }

  const params = parseAuthCallbackParams(result.url);
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (params.error !== undefined) {
    throw new Error(params.error_description ?? params.error);
  }
  if (accessToken === undefined || refreshToken === undefined) {
    return;
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}
