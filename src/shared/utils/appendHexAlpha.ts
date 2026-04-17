/**
 * Appends an 8-bit hex alpha suffix (#RRGGBBAA) to #RGB or #RRGGBB colors.
 * Returns the input unchanged if it is not a hex color (e.g. rgba()).
 */
export function appendHexAlpha(color: string, alphaHex: string): string {
  const normalized = color.trim();
  const long = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (long) {
    return `#${long[1]}${alphaHex}`;
  }
  const short = /^#([0-9a-f]{3})$/i.exec(normalized);
  if (short) {
    const [r, g, b] = short[1].split('').map((c) => c + c);
    return `#${r}${g}${b}${alphaHex}`;
  }
  return normalized;
}
