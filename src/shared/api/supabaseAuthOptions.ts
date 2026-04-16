import type AsyncStorage from '@react-native-async-storage/async-storage';

export type SupabaseAuthOptionsInput = {
  storybookBundle: boolean;
  isWeb: boolean;
  storage: typeof AsyncStorage;
};

/**
 * Supabase auth client options. When Storybook is bundled, turn off session
 * persistence and auto-refresh so the UI does not call local Supabase (e.g. 127.0.0.1:54321).
 */
export function buildSupabaseAuthOptions(options: SupabaseAuthOptionsInput): {
  storage: typeof AsyncStorage;
  autoRefreshToken: boolean;
  persistSession: boolean;
  detectSessionInUrl: boolean;
} {
  const { storybookBundle: sb, isWeb, storage } = options;
  return {
    storage,
    autoRefreshToken: !sb,
    persistSession: !sb,
    // Web OAuth returns tokens in the URL; native uses deep links + setSession.
    detectSessionInUrl: isWeb && !sb,
  };
}
