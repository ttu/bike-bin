import { isDuplicateTag, sanitizeTag, canAddTag, MAX_TAGS, MAX_TAG_LENGTH } from '../tagUtils';

describe('sanitizeTag', () => {
  it('trims whitespace', () => {
    expect(sanitizeTag('  carbon  ')).toBe('carbon');
  });

  it('preserves case and spaces', () => {
    expect(sanitizeTag('My Oldie Stuff')).toBe('My Oldie Stuff');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeTag('   ')).toBe('');
  });
});

describe('isDuplicateTag', () => {
  it('detects exact duplicates', () => {
    expect(isDuplicateTag('carbon', ['carbon', 'vintage'])).toBe(true);
  });

  it('detects case-insensitive duplicates', () => {
    expect(isDuplicateTag('Carbon', ['carbon', 'vintage'])).toBe(true);
  });

  it('returns false for non-duplicate', () => {
    expect(isDuplicateTag('new-tag', ['carbon', 'vintage'])).toBe(false);
  });
});

describe('canAddTag', () => {
  it('rejects empty tags', () => {
    expect(canAddTag('', [])).toBe(false);
  });

  it('rejects whitespace-only tags', () => {
    expect(canAddTag('   ', [])).toBe(false);
  });

  it('rejects duplicate tags', () => {
    expect(canAddTag('Carbon', ['carbon'])).toBe(false);
  });

  it('rejects tags exceeding max length', () => {
    expect(canAddTag('a'.repeat(MAX_TAG_LENGTH + 1), [])).toBe(false);
  });

  it('rejects when at max tag count', () => {
    const tags = Array.from({ length: MAX_TAGS }, (_, i) => `tag${i}`);
    expect(canAddTag('one-more', tags)).toBe(false);
  });

  it('accepts valid tags', () => {
    expect(canAddTag('My Oldie Stuff', ['carbon'])).toBe(true);
  });
});
