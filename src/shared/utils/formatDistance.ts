type Translator = (key: string, options?: Record<string, unknown>) => string;

/** Format a distance in meters to a localized human-readable string. */
export function formatDistance(meters: number | undefined, t: Translator): string {
  if (meters === undefined) return '';
  if (meters < 1000) return t('common:distance.meters', { value: Math.round(meters) });
  return t('common:distance.kilometers', { value: (meters / 1000).toFixed(1) });
}
