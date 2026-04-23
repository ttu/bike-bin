import { Platform } from 'react-native';
import Svg from 'react-native-svg';
import { renderWithProviders } from '@/test/utils';
import { SocketBBMark } from './SocketBBMark';

describe('SocketBBMark', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  const getSvgProps = (ui: React.ReactElement) => {
    const { UNSAFE_getByType } = renderWithProviders(ui);
    return UNSAFE_getByType(Svg).props;
  };

  it('is decorative on native when no label is provided', () => {
    Platform.OS = 'ios';
    const props = getSvgProps(<SocketBBMark />);
    expect(props.accessible).toBe(false);
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe('no');
  });

  it('is decorative on web when no label is provided', () => {
    Platform.OS = 'web';
    const props = getSvgProps(<SocketBBMark />);
    expect(props['aria-hidden']).toBe(true);
  });

  it('exposes native a11y props when labeled', () => {
    Platform.OS = 'android';
    const props = getSvgProps(<SocketBBMark accessibilityLabel="Bike Bin" />);
    expect(props.accessible).toBe(true);
    expect(props.accessibilityLabel).toBe('Bike Bin');
    expect(props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('exposes web a11y props when labeled', () => {
    Platform.OS = 'web';
    const props = getSvgProps(<SocketBBMark accessibilityLabel="Bike Bin" />);
    expect(props.role).toBe('img');
    expect(props['aria-label']).toBe('Bike Bin');
    expect(props.accessibilityLabel).toBeUndefined();
  });
});
