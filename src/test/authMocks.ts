/**
 * Shared useAuth mock factories.
 *
 * Usage:
 *   jest.mock('@/features/auth', () => createAuthMock());
 *   // or with custom user id:
 *   jest.mock('@/features/auth', () => createAuthMock('custom-user-id'));
 */

export interface AuthMockState {
  isAuthenticated: boolean;
}

/**
 * Creates a `@/features/auth` mock module with an authenticated user.
 * Pass a userId to override the default 'user-123'.
 */
export function createAuthMock(userId = 'user-123') {
  return {
    useAuth: () => ({
      user: { id: userId },
      isAuthenticated: true,
    }),
  };
}

/**
 * Creates a full `@/features/auth` mock with sign-in/sign-out methods.
 * The `state` object can be mutated in tests to toggle authentication.
 */
export function createFullAuthMock(userId = 'user-123') {
  const state: AuthMockState = { isAuthenticated: true };

  return {
    state,
    mock: {
      useAuth: () => ({
        user: state.isAuthenticated ? { id: userId } : null,
        isAuthenticated: state.isAuthenticated,
        isLoading: false,
        session: null,
        signInWithGoogle: jest.fn(),
        signInWithApple: jest.fn(),
        signOut: jest.fn(),
      }),
    },
  };
}

/**
 * Creates an unauthenticated `@/features/auth` mock module.
 */
export function createUnauthenticatedAuthMock() {
  return {
    useAuth: () => ({
      user: null,
      isAuthenticated: false,
    }),
  };
}
