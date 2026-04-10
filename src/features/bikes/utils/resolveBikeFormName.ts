/**
 * When the name field is blank, the saved title is built from brand and model
 * (for example "Canyon" and "Grail" → "Canyon Grail").
 */
export function resolveBikeFormName(name: string, brand: string, model: string): string {
  const trimmedName = name.trim();
  if (trimmedName.length > 0) {
    return trimmedName;
  }
  return [brand.trim(), model.trim()].filter((part) => part.length > 0).join(' ');
}
