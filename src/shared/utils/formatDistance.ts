/** Format a distance in meters to a human-readable string (e.g. "450 m", "2.3 km"). */
export function formatDistance(meters: number | undefined): string {
  if (meters === undefined) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
