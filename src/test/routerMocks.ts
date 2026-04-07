/**
 * Shared expo-router mock factories for screen tests.
 *
 * Usage:
 *   const routerMocks = createRouterMocks({ id: 'item-123' });
 *   jest.mock('expo-router', () => routerMocks.module);
 *   // Then assert: expect(routerMocks.push).toHaveBeenCalledWith(...)
 */

export interface RouterMocksResult {
  push: jest.Mock;
  replace: jest.Mock;
  dismiss: jest.Mock;
  canDismiss: jest.Mock;
  back: jest.Mock;
  module: Record<string, unknown>;
  searchParams: Record<string, string | string[] | undefined>;
}

/**
 * Creates an expo-router mock module with all commonly-used exports.
 * The `searchParams` object is mutable — change it in tests to simulate different routes.
 */
export function createRouterMocks(
  initialSearchParams: Record<string, string | string[] | undefined> = {},
): RouterMocksResult {
  const push = jest.fn();
  const replace = jest.fn();
  const dismiss = jest.fn();
  const canDismiss = jest.fn().mockReturnValue(true);
  const back = jest.fn();

  const searchParams = { ...initialSearchParams };

  return {
    push,
    replace,
    dismiss,
    canDismiss,
    back,
    searchParams,
    module: {
      useLocalSearchParams: () => searchParams,
      useRouter: () => ({ push, replace }),
      router: {
        push: (...args: unknown[]) => push(...args),
        replace: (...args: unknown[]) => replace(...args),
        canDismiss: () => canDismiss(),
        dismiss: (...args: unknown[]) => dismiss(...args),
        back: (...args: unknown[]) => back(...args),
      },
    },
  };
}
