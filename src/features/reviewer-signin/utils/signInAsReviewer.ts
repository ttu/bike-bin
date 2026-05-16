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
      return { ok: false, error: 'invalidCredentials' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}
