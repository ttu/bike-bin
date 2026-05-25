import { supabase } from '@/shared/api/supabase';

export type ReviewerSignInError = 'invalidCredentials' | 'network';

export type ReviewerSignInResult = { ok: true } | { ok: false; error: ReviewerSignInError };

export async function signInAsReviewer(
  email: string,
  password: string,
): Promise<ReviewerSignInResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === 'invalid_credentials') {
        return { ok: false, error: 'invalidCredentials' };
      }
      return { ok: false, error: 'network' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}
