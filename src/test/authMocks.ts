/**
 * Shared useAuth mock for test files.
 *
 * All exports are prefixed with `mock` so they can be referenced inside
 * jest.mock() factories.
 *
 * Usage:
 *   import { mockAuthModule } from '@/test/authMocks';
 *   jest.mock('@/features/auth', () => mockAuthModule);
 */

/** Standard authenticated auth module mock — `user.id` is 'user-123'. */
export const mockAuthModule = {
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
};
