import { COUNTRIES } from '../countries';

describe('COUNTRIES', () => {
  it('is non-empty', () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
  });

  it('uses lowercase 2-letter alpha-2 codes', () => {
    for (const c of COUNTRIES) {
      expect(c.code).toMatch(/^[a-z]{2}$/);
    }
  });

  it('has unique codes', () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('has non-empty English names', () => {
    for (const c of COUNTRIES) {
      expect(c.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes well-known countries (fi, gb, us, de)', () => {
    const codes = COUNTRIES.map((c) => c.code);
    for (const code of ['fi', 'gb', 'us', 'de']) {
      expect(codes).toContain(code);
    }
  });
});
