import { nullToUndef } from '../nullToUndef';

describe('nullToUndef', () => {
  it('returns undefined for null', () => {
    expect(nullToUndef<string>(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(nullToUndef<string>(undefined)).toBeUndefined();
  });

  it('preserves non-nullish primitives', () => {
    expect(nullToUndef('hello')).toBe('hello');
    expect(nullToUndef(0)).toBe(0);
    expect(nullToUndef(false)).toBe(false);
    expect(nullToUndef('')).toBe('');
  });

  it('preserves objects by reference', () => {
    const obj = { a: 1 };
    expect(nullToUndef(obj)).toBe(obj);
  });
});
