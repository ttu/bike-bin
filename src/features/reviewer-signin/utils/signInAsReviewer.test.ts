import { signInAsReviewer } from './signInAsReviewer';
import { supabase } from '@/shared/api/supabase';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

const signInWithPassword = supabase.auth.signInWithPassword as jest.Mock;

describe('signInAsReviewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok on success', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await expect(signInAsReviewer('a@b.test', 'pw')).resolves.toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.test', password: 'pw' });
  });

  it('returns invalidCredentials when supabase reports an error', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    await expect(signInAsReviewer('a@b.test', 'wrong')).resolves.toEqual({
      ok: false,
      error: 'invalidCredentials',
    });
  });

  it('returns network when the call rejects', async () => {
    signInWithPassword.mockRejectedValue(new Error('fetch failed'));
    await expect(signInAsReviewer('a@b.test', 'pw')).resolves.toEqual({
      ok: false,
      error: 'network',
    });
  });
});
