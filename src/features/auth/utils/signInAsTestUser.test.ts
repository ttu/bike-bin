import { router } from 'expo-router';
import { supabase } from '@/shared/api/supabase';
import { TEST_USER_PASSWORD, MAIN_TEST_USER } from '@/shared/constants/testUsers';
import { signInAsTestUser } from './signInAsTestUser';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const mockReplace = router.replace as jest.Mock;

describe('signInAsTestUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs in with the shared demo password and navigates to inventory', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    await expect(signInAsTestUser(MAIN_TEST_USER.email)).resolves.toBe(true);

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: MAIN_TEST_USER.email,
      password: TEST_USER_PASSWORD,
    });
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('reports failure and stays put when Supabase rejects the credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    await expect(signInAsTestUser(MAIN_TEST_USER.email)).resolves.toBe(false);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('reports failure and stays put when the sign-in call throws', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('network down'));

    await expect(signInAsTestUser(MAIN_TEST_USER.email)).resolves.toBe(false);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
