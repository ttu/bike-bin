/** Parses optional non-negative numeric text from a form field (comma as decimal). */
export function optionalNumberFromInput(raw: string): {
  value: number | undefined;
  invalid: boolean;
} {
  const t = raw.trim();
  if (!t) return { value: undefined, invalid: false };
  const tNormalized = t.replaceAll(',', '.');
  const n = Number(tNormalized);
  if (!Number.isFinite(n) || n < 0) return { value: undefined, invalid: true };
  return { value: n, invalid: false };
}
