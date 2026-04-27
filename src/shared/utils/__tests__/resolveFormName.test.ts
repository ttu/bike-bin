import { resolveFormName } from '../resolveFormName';

describe('resolveFormName', () => {
  it('returns the trimmed name when provided', () => {
    expect(resolveFormName('  Cassette  ', 'Shimano', 'XTR')).toBe('Cassette');
  });

  it('falls back to "brand model" when name is blank', () => {
    expect(resolveFormName('', 'Shimano', 'XTR 1500')).toBe('Shimano XTR 1500');
  });

  it('treats whitespace-only names as blank', () => {
    expect(resolveFormName('   ', 'Shimano', 'XTR 1500')).toBe('Shimano XTR 1500');
    expect(resolveFormName('\t  \n', '', 'XTR')).toBe('XTR');
  });

  it('returns just the brand when model is missing', () => {
    expect(resolveFormName('', 'Shimano', '')).toBe('Shimano');
  });

  it('returns just the model when brand is missing', () => {
    expect(resolveFormName('', '', 'XTR 1500')).toBe('XTR 1500');
  });

  it('returns an empty string when all fields are blank', () => {
    expect(resolveFormName('', '', '')).toBe('');
  });
});
