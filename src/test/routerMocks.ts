/**
 * Shared expo-router mock for screen tests.
 *
 * All exports are prefixed with `mock` so they can be referenced inside
 * jest.mock() factories.
 *
 * Usage:
 *   import { mockRouterModule, mockRouterPush, mockRouterReplace, mockSearchParams } from '@/test/routerMocks';
 *   jest.mock('expo-router', () => mockRouterModule);
 *
 * Mutate `mockSearchParams` in tests to simulate different routes.
 * Call jest.clearAllMocks() in beforeEach to reset mock call history.
 */

export const mockRouterPush = jest.fn();
export const mockRouterReplace = jest.fn();
export const mockRouterDismiss = jest.fn();
export const mockRouterCanDismiss = jest.fn().mockReturnValue(true);
export const mockRouterBack = jest.fn();

/** Mutable search params — modify in tests to change route params. */
export const mockSearchParams: Record<string, string | string[] | undefined> = {};

export const mockRouterModule = {
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    canDismiss: mockRouterCanDismiss,
    dismiss: mockRouterDismiss,
    back: mockRouterBack,
  }),
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    canDismiss: () => mockRouterCanDismiss(),
    dismiss: (...args: unknown[]) => mockRouterDismiss(...args),
    back: (...args: unknown[]) => mockRouterBack(...args),
  },
};
