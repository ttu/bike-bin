import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { buildSupabaseAuthOptions } from './supabaseAuthOptions';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** When Storybook runs inside the app bundle, skip persisted session + refresh (avoids calls to local Supabase). */
const storybookBundle =
  typeof process !== 'undefined' && process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: buildSupabaseAuthOptions({
    storybookBundle,
    isWeb: Platform.OS === 'web',
    storage: AsyncStorage,
  }),
});
