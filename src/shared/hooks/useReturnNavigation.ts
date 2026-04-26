import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';
import { decodeReturnPathParam, isSafeTabReturnPath } from '@/shared/utils/returnPath';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';

/**
 * Returns a `handleBack` callback that decodes a return-path parameter,
 * navigating to it if valid, or falling back to `fallbackHref`.
 */
export function useReturnNavigation(
  returnPath: string | undefined,
  fallbackHref: Href,
): () => void {
  const router = useRouter();

  return useCallback(() => {
    const decoded = decodeReturnPathParam(returnPath);
    if (decoded && isSafeTabReturnPath(decoded)) {
      router.replace(decoded as Href);
      return;
    }
    tabScopedBack(fallbackHref);
  }, [returnPath, router, fallbackHref]);
}
