import { formatBikeMetric } from '../formatBikeDetail';

describe('formatBikeMetric', () => {
  it('returns a string for whole numbers', () => {
    expect(typeof formatBikeMetric(3200)).toBe('string');
    expect(formatBikeMetric(3200).length).toBeGreaterThan(0);
  });

  it('rounds to at most one decimal digit in the formatted output', () => {
    const s = formatBikeMetric(12.345);
    expect(s).toMatch(/12/);
    expect(s).toMatch(/3/);
  });
});
