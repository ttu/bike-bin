/**
 * Parse user-entered percent (0–100) into a stored fraction (0–1).
 * Returns undefined if empty or invalid.
 */
export function parseRemainingPercentInput(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return undefined;
  }
  // Whole percent only — reject decimals so "12.5" is not read as 12%.
  if (trimmed.includes('.') || !/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    return undefined;
  }
  return n / 100;
}

/** Form field string for an existing fraction (0–1). */
export function formatRemainingPercentField(fraction: number | undefined): string {
  if (fraction === undefined) {
    return '';
  }
  return String(Math.round(fraction * 100));
}
