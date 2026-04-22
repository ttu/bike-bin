import { StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { lightTheme } from '@/shared/theme';
import { ScreenMasthead } from './ScreenMasthead';

describe('ScreenMasthead', () => {
  it('renders title uppercased', () => {
    renderWithProviders(<ScreenMasthead title="Inventory" />);
    expect(screen.getByText('INVENTORY')).toBeTruthy();
  });

  it('renders eyebrow when provided', () => {
    renderWithProviders(<ScreenMasthead eyebrow="Your collection" title="Inventory" />);
    expect(screen.getByText('Your collection')).toBeTruthy();
  });

  it('omits eyebrow when not provided', () => {
    renderWithProviders(<ScreenMasthead title="Inventory" />);
    expect(screen.queryByText('Your collection')).toBeNull();
  });

  it('renders counts with values and labels', () => {
    renderWithProviders(
      <ScreenMasthead
        title="Inventory"
        counts={[
          { value: 12, label: 'items' },
          { value: 3, label: 'mounted' },
          { value: 2, label: 'listed', tone: 'accent' },
        ]}
      />,
    );
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('items')).toBeTruthy();
    expect(screen.getByText('listed')).toBeTruthy();
  });

  it('applies accent color to accent-toned count figure', () => {
    renderWithProviders(
      <ScreenMasthead title="Inventory" counts={[{ value: 2, label: 'listed', tone: 'accent' }]} />,
    );
    const figure = screen.getByText('2');
    const flat = StyleSheet.flatten(figure.props.style);
    expect(flat.color).toBe(lightTheme.customColors.accent);
    const stamp = screen.getByText('listed');
    expect(StyleSheet.flatten(stamp.props.style).color).toBe(lightTheme.customColors.accent);
  });

  it('applies tight letterSpacing on title', () => {
    renderWithProviders(<ScreenMasthead title="Nearby" />);
    const flat = StyleSheet.flatten(screen.getByText('NEARBY').props.style);
    expect(flat.letterSpacing).toBe(-1.2);
  });
});
