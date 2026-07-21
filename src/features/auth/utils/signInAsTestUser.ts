import { router } from 'expo-router';
import { supabase } from '@/shared/api/supabase';
import { TEST_USER_PASSWORD } from '@/shared/constants/testUsers';

/**
 * Signs in one of the seeded test users with the shared demo password and lands
 * on the inventory tab. Dev-only affordance gated by `isPasswordDemoLoginEnabled`,
 * so failures are logged rather than surfaced. Resolves to whether sign-in
 * succeeded — callers keep their own busy state.
 */
export async function signInAsTestUser(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: TEST_USER_PASSWORD,
    });
    if (error) {
      console.error('Dev login failed:', error.message);
      return false;
    }
    router.replace('/(tabs)/inventory');
    return true;
  } catch (e) {
    console.error('Dev login error:', e);
    return false;
  }
}
