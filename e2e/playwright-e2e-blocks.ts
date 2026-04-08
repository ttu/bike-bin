/**
 * Spec groupings shared by `playwright.config.ts` (local Metro) and
 * `playwright.remote-full.config.ts` (deployed preview). Keep in sync with `e2e/*.spec.ts`.
 */
export const e2eBlocks = {
  'e2e-auth-smoke': [
    'smoke.spec.ts',
    'auth.spec.ts',
    'accessibility.spec.ts',
    'responsive.spec.ts',
  ],
  'e2e-search-inventory': [
    'search.spec.ts',
    'search-authenticated.spec.ts',
    'inventory.spec.ts',
    'inventory-authenticated.spec.ts',
    'inventory-gallery.spec.ts',
  ],
  'e2e-inventory-bikes': [
    'inventory-crud.spec.ts',
    'inventory-status.spec.ts',
    'bikes-crud.spec.ts',
  ],
  'e2e-messaging-borrow': [
    'messaging.spec.ts',
    'messaging-actions.spec.ts',
    'messages-authenticated.spec.ts',
    'borrow.spec.ts',
    'borrow-lifecycle.spec.ts',
    'profile-authenticated.spec.ts',
  ],
} as const;
