import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { mockAuthModule } from '@/test/authMocks';
import profileEn from '@/i18n/en/profile.json';
import SupportScreen from '../support';

const mockMutate = jest.fn();

jest.mock('expo-constants', () => ({
  expoConfig: { version: '9.9.9' },
}));

jest.mock('@/features/profile/hooks/useSubmitSupport', () => ({
  useSubmitSupport: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

jest.mock('@/features/auth', () => mockAuthModule);

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

describe('SupportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits support with authenticated user id', () => {
    renderWithProviders(<SupportScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText(profileEn.support.subjectPlaceholder),
      'Broken export',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText(profileEn.support.messagePlaceholder),
      'Steps to reproduce…',
    );
    fireEvent.press(screen.getByText(profileEn.support.send));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        subject: 'Broken export',
        body: 'Steps to reproduce…',
        appVersion: '9.9.9',
        deviceInfo: expect.stringMatching(/^(ios|android|web)\s/i),
      }),
      expect.any(Object),
    );
  });
});
