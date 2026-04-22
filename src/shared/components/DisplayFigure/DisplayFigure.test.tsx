import { StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { DisplayFigure } from './DisplayFigure';

describe('DisplayFigure', () => {
  it('renders value text', () => {
    renderWithProviders(<DisplayFigure value="11-34" />);
    expect(screen.getByText('11-34')).toBeTruthy();
  });

  it('renders unit when provided', () => {
    renderWithProviders(<DisplayFigure value="269" unit="g" />);
    expect(screen.getByText('g')).toBeTruthy();
  });

  it('renders note when provided', () => {
    renderWithProviders(<DisplayFigure value="40" unit="%" note="wear" />);
    expect(screen.getByText('wear')).toBeTruthy();
  });

  it('does not render unit or note when omitted', () => {
    renderWithProviders(<DisplayFigure value="2022" />);
    expect(screen.getByText('2022')).toBeTruthy();
    expect(screen.queryByText('wear')).toBeNull();
  });

  it('uses BigShoulders-ExtraBold for value', () => {
    renderWithProviders(<DisplayFigure value="175" />);
    const valueText = screen.getByText('175');
    const flatStyle = StyleSheet.flatten(valueText.props.style);
    expect(flatStyle).toEqual(expect.objectContaining({ fontFamily: 'BigShoulders-ExtraBold' }));
  });
});
