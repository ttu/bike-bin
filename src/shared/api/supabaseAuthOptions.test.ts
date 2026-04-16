import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildSupabaseAuthOptions } from './supabaseAuthOptions';

describe('buildSupabaseAuthOptions', () => {
  it('matches normal app: refresh + persist on; web session detection on when web', () => {
    expect(
      buildSupabaseAuthOptions({ storybookBundle: false, isWeb: true, storage: AsyncStorage }),
    ).toMatchObject({
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    });
  });

  it('matches normal app on native: detectSessionInUrl off', () => {
    expect(
      buildSupabaseAuthOptions({ storybookBundle: false, isWeb: false, storage: AsyncStorage }),
    ).toMatchObject({
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    });
  });

  it('Storybook bundle: no refresh, no persist, no URL session detection', () => {
    expect(
      buildSupabaseAuthOptions({ storybookBundle: true, isWeb: true, storage: AsyncStorage }),
    ).toMatchObject({
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    });
  });
});
