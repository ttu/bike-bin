import { StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { lightTheme } from '@/shared/theme';
import { Stamp } from './Stamp';

describe('Stamp', () => {
  it('renders children as uppercase tracked label', () => {
    renderWithProviders(<Stamp>Your collection</Stamp>);
    const node = screen.getByText('Your collection');
    const flat = StyleSheet.flatten(node.props.style);
    expect(flat).toEqual(
      expect.objectContaining({
        fontFamily: 'Manrope-Bold',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }),
    );
  });

  it('applies ink tone by default', () => {
    renderWithProviders(<Stamp>Listed</Stamp>);
    const flat = StyleSheet.flatten(screen.getByText('Listed').props.style);
    expect(flat.color).toBe(lightTheme.colors.onBackground);
  });

  it('applies accent tone color', () => {
    renderWithProviders(<Stamp tone="accent">Listed</Stamp>);
    const flat = StyleSheet.flatten(screen.getByText('Listed').props.style);
    expect(flat.color).toBe(lightTheme.customColors.accent);
  });

  it('applies dim tone color', () => {
    renderWithProviders(<Stamp tone="dim">Sort · recent</Stamp>);
    const flat = StyleSheet.flatten(screen.getByText('Sort · recent').props.style);
    expect(flat.color).toBe(lightTheme.colors.onSurfaceVariant);
  });

  it('honors custom size', () => {
    renderWithProviders(<Stamp size={14}>Service record</Stamp>);
    const flat = StyleSheet.flatten(screen.getByText('Service record').props.style);
    expect(flat.fontSize).toBe(14);
  });
});
