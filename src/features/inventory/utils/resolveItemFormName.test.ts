import { resolveItemFormName } from './resolveItemFormName';

describe('resolveItemFormName', () => {
  it('returns trimmed name when name is non-empty', () => {
    expect(resolveItemFormName('  Cassette  ', 'Shimano', 'XTR')).toBe('Cassette');
  });

  it('joins brand and model when name is empty', () => {
    expect(resolveItemFormName('', 'Shimano', 'XTR 1500')).toBe('Shimano XTR 1500');
  });

  it('treats whitespace-only name as empty and joins brand and model', () => {
    expect(resolveItemFormName('   ', 'Shimano', 'XTR 1500')).toBe('Shimano XTR 1500');
    expect(resolveItemFormName('\t  \n', '', 'XTR')).toBe('XTR');
  });

  it('uses only brand when model is empty', () => {
    expect(resolveItemFormName('', 'Shimano', '')).toBe('Shimano');
  });

  it('uses only model when brand is empty', () => {
    expect(resolveItemFormName('', '', 'XTR 1500')).toBe('XTR 1500');
  });

  it('returns empty string when all are blank', () => {
    expect(resolveItemFormName('', '', '')).toBe('');
  });
});
