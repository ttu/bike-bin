const REGIONAL_INDICATOR_A = 0x1f1e6;

export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  const upper = code.toUpperCase();
  const first = REGIONAL_INDICATOR_A + (upper.charCodeAt(0) - 65);
  const second = REGIONAL_INDICATOR_A + (upper.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}
