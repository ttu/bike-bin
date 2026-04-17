import { lightTheme, darkTheme, spacing, borderRadius } from '../index';

describe('Theme', () => {
  it('defines light theme with Kinetic Curator primary', () => {
    expect(lightTheme.colors.primary).toBe('#006857');
  });

  it('defines dark theme with Kinetic Curator primary', () => {
    expect(darkTheme.colors.primary).toBe('#5ddbbe');
  });

  it('includes surface container tokens in light theme', () => {
    expect(lightTheme.customColors.surfaceContainerLowest).toBe('#faf8f5');
    expect(lightTheme.customColors.surfaceContainerLow).toBe('#f0ede6');
    expect(lightTheme.customColors.surfaceContainer).toBe('#eae7e0');
    expect(lightTheme.customColors.surfaceContainerHigh).toBe('#e4e0d9');
    expect(lightTheme.customColors.surfaceContainerHighest).toBe('#dedad3');
  });

  it('includes surface container tokens in dark theme', () => {
    expect(darkTheme.customColors.surfaceContainerLowest).toBe('#0e0c0a');
    expect(darkTheme.customColors.surfaceContainerLow).toBe('#1e1b18');
    expect(darkTheme.customColors.surfaceContainerHigh).toBe('#2a2824');
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
