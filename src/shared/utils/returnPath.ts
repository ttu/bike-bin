/**
 * Encodes a tab route for passing as a search param (slashes and parens are safe after encoding).
 */
export function encodeReturnPath(path: string): string {
  return encodeURIComponent(path);
}

/**
 * Decodes returnPath from useLocalSearchParams (handles string | string[] from query).
 */
export function decodeReturnPathParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return undefined;
  }
}

/**
 * Only in-app tab routes; blocks open redirects and path traversal.
 */
export function isSafeTabReturnPath(path: string): boolean {
  if (!path.startsWith('/(tabs)/')) return false;
  if (path.includes('..')) return false;
  if (path.includes('://')) return false;
  if (path.length > 512) return false;
  return true;
}
