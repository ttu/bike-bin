import { lightTheme, darkTheme, spacing, borderRadius } from '../index';

describe('Theme', () => {
  it('defines light theme with teal primary', () => {
    expect(lightTheme.colors.primary).toBe('#0D9488');
  });

  it('defines dark theme with teal primary', () => {
    expect(darkTheme.colors.primary).toBe('#2DD4BF');
  });

  it('defines spacing scale', () => {
    expect(spacing.base).toBe(16);
    expect(spacing.xs).toBe(4);
  });

  it('defines border radius tokens', () => {
    expect(borderRadius.md).toBe(12);
    expect(borderRadius.full).toBe(9999);
  });
});
