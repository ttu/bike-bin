/** Formats a numeric bike metric for display (locale-aware, up to one decimal). */
export function formatBikeMetric(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}
