import { Linking } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import AboutScreen from '../about';

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaView: View,
    SafeAreaProvider: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

describe('AboutScreen', () => {
  let openUrlSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    openUrlSpy.mockRestore();
  });

  it('calls tabScopedBack when back is pressed', () => {
    const { getByLabelText } = renderWithProviders(<AboutScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(jest.mocked(tabScopedBack)).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('opens terms, privacy, and licenses URLs from list rows', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    fireEvent.press(getByText('Terms of Service'));
    expect(openUrlSpy).toHaveBeenCalledWith('https://bikebin.app/terms');
    fireEvent.press(getByText('Privacy Policy'));
    expect(openUrlSpy).toHaveBeenCalledWith('https://bikebin.app/privacy');
    fireEvent.press(getByText('Open Source Licenses'));
    expect(openUrlSpy).toHaveBeenCalledWith('https://bikebin.app/licenses');
  });

  it('shows app version row', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    expect(getByText('App Version')).toBeTruthy();
    expect(getByText('Made with love for the cycling community')).toBeTruthy();
  });
});
