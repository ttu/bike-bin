import { countryFlag } from '../countryFlag';

describe('countryFlag', () => {
  it('returns the Finnish flag for "fi"', () => {
    expect(countryFlag('fi')).toBe('🇫🇮');
  });

  it('returns the UK flag for "gb"', () => {
    expect(countryFlag('gb')).toBe('🇬🇧');
  });

  it('is case-insensitive', () => {
    expect(countryFlag('US')).toBe('🇺🇸');
  });

  it('returns empty string for malformed input', () => {
    expect(countryFlag('')).toBe('');
    expect(countryFlag('x')).toBe('');
    expect(countryFlag('xyz')).toBe('');
    expect(countryFlag('1a')).toBe('');
  });
});
