import { lightTheme, darkTheme, spacing, borderRadius } from '../index';

describe('Theme', () => {
  it('defines light theme with Kinetic Curator primary', () => {
    expect(lightTheme.colors.primary).toBe('#006857');
  });

  it('defines dark theme with Kinetic Curator primary', () => {
    expect(darkTheme.colors.primary).toBe('#5ddbbe');
  });

  it('includes surface container tokens in light theme', () => {
    expect(lightTheme.customColors.surfaceContainerLowest).toBe('#ffffff');
    expect(lightTheme.customColors.surfaceContainerLow).toBe('#f1f4fa');
    expect(lightTheme.customColors.surfaceContainer).toBe('#ebeef4');
    expect(lightTheme.customColors.surfaceContainerHigh).toBe('#e5e8ee');
    expect(lightTheme.customColors.surfaceContainerHighest).toBe('#dfe3e8');
  });

  it('includes surface container tokens in dark theme', () => {
    expect(darkTheme.customColors.surfaceContainerLowest).toBe('#0b0f12');
    expect(darkTheme.customColors.surfaceContainerLow).toBe('#1a1e22');
    expect(darkTheme.customColors.surfaceContainerHigh).toBe('#252a2e');
  });

  it('includes tertiary colors for community features', () => {
    expect(lightTheme.colors.tertiary).toBe('#385d8c');
    expect(darkTheme.colors.tertiary).toBe('#a4c9fe');
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
