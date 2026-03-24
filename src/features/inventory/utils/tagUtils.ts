export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 50;

export function sanitizeTag(input: string): string {
  return input.trim();
}

export function isDuplicateTag(tag: string, existingTags: string[]): boolean {
  const lower = tag.toLowerCase();
  return existingTags.some((t) => t.toLowerCase() === lower);
}

export function canAddTag(rawInput: string, existingTags: string[]): boolean {
  const tag = sanitizeTag(rawInput);
  if (tag.length === 0) return false;
  if (tag.length > MAX_TAG_LENGTH) return false;
  if (existingTags.length >= MAX_TAGS) return false;
  if (isDuplicateTag(tag, existingTags)) return false;
  return true;
}
