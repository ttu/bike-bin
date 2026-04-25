import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { configureNavigationForWeb } from '../configureNavigationForWeb';

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

describe('configureNavigationForWeb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls enableScreens(true) when Platform.OS is web', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    configureNavigationForWeb();
    expect(enableScreens).toHaveBeenCalledTimes(1);
    expect(enableScreens).toHaveBeenCalledWith(true);
  });

  it('does not call enableScreens when Platform.OS is not web', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    configureNavigationForWeb();
    expect(enableScreens).not.toHaveBeenCalled();
  });
});
