// Build-time feature flags for hiding incomplete surfaces before release.
//
// Each flag is OFF unless its env var is explicitly the string 'true'. Anything
// else (unset, 'false', '0', ...) is off. Flags are evaluated at import, so
// flipping one is a rebuild/redeploy — there is no runtime/remote config.
//
// In the Jest environment both flags are forced on (see src/test/setup.ts) so
// the existing suite renders gated surfaces. Tests covering the off behavior
// re-require this module with `jest.isolateModules` after overriding the env
// var (see featureFlags.test.ts and the env.ts/env.test.ts precedent).

/** Buy/Sell/Borrow + Messages + ratings/reviews (all entangled via messaging). */
export const isMarketplaceEnabled = process.env.EXPO_PUBLIC_FEATURE_MARKETPLACE === 'true';

/** Groups tab + group conversations. */
export const isGroupsEnabled = process.env.EXPO_PUBLIC_FEATURE_GROUPS === 'true';
