import { resolveBikeFormName } from '../resolveBikeFormName';

describe('resolveBikeFormName', () => {
  it('returns trimmed name when present', () => {
    expect(resolveBikeFormName('  My Bike ', 'A', 'B')).toBe('My Bike');
  });

  it('joins brand and model when name is empty', () => {
    expect(resolveBikeFormName('', 'Trek', 'Fuel EX')).toBe('Trek Fuel EX');
  });

  it('uses only brand when model is empty', () => {
    expect(resolveBikeFormName('', 'Specialized', '')).toBe('Specialized');
  });

  it('uses only model when brand is empty', () => {
    expect(resolveBikeFormName('', '', 'Tarmac')).toBe('Tarmac');
  });

  it('returns empty string when all empty', () => {
    expect(resolveBikeFormName('', '', '')).toBe('');
  });
});
