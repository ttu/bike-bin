import { router, type Href } from 'expo-router';

/**
 * Pops one screen within the current tab's stack (Expo Router `dismiss`).
 * If the tab stack has only one screen, navigates to `fallback` with `replace`
 * so back never jumps to another tab's history.
 */
export function tabScopedBack(fallback: Href): void {
  if (router.canDismiss()) {
    router.dismiss(1);
    return;
  }
  router.replace(fallback);
}
