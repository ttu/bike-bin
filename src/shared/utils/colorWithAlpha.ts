/**
 * Returns a hex color with an alpha channel appended.
 *
 * Replaces the brittle `color + 'XX'` concatenation pattern that breaks
 * with non-hex color formats and is hard to read without a hex-to-percent
 * lookup table.
 *
 * @param hexColor – A 7-character hex color string (#RRGGBB).
 * @param opacity  – Alpha value between 0 (transparent) and 1 (opaque).
 * @returns An 8-digit hex color (#RRGGBBAA).
 */
export function colorWithAlpha(hexColor: string, opacity: number): string {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hexColor}${alpha}`;
}
