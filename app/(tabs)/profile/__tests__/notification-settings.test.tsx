import { Platform } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import commonEn from '@/i18n/en/common.json';
import notificationsEn from '@/i18n/en/notifications.json';
import NotificationSettingsScreen from '../notification-settings';

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockUpdatePreferences = jest.fn();

const mockNotifPrefsState = {
  isLoading: false,
  preferences: {
    messages: { push: true, email: false },
    borrowActivity: { push: true, email: true },
    reminders: { push: false, email: true },
  },
};

jest.mock('@/features/notifications', () => ({
  useNotificationPreferences: () => ({
    preferences: mockNotifPrefsState.preferences,
    isLoading: mockNotifPrefsState.isLoading,
    updatePreferences: mockUpdatePreferences,
  }),
}));

describe('NotificationSettingsScreen', () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifPrefsState.isLoading = false;
    Platform.OS = 'ios';
  });

  afterEach(() => {
    Platform.OS = originalOs;
  });

  it('shows loading indicator while preferences load', () => {
    mockNotifPrefsState.isLoading = true;
    renderWithProviders(<NotificationSettingsScreen />);
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
  });

  it('calls tabScopedBack when back is pressed', () => {
    const { getByLabelText } = renderWithProviders(<NotificationSettingsScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(jest.mocked(tabScopedBack)).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('renders settings title and description', () => {
    const { getByText } = renderWithProviders(<NotificationSettingsScreen />);
    expect(getByText('Notification Settings')).toBeTruthy();
    expect(getByText('Choose how you want to be notified')).toBeTruthy();
  });

  it('updates preferences when a switch is toggled', () => {
    const { getAllByRole } = renderWithProviders(<NotificationSettingsScreen />);
    const switches = getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    fireEvent(switches[0], 'onValueChange', false);
    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.objectContaining({ push: false, email: false }) as Record<string, unknown>,
      }),
    );
  });

  it('on web, shows push unavailable note', () => {
    Platform.OS = 'web';
    renderWithProviders(<NotificationSettingsScreen />);
    expect(screen.getByText(notificationsEn.settings.pushNotAvailable)).toBeTruthy();
  });
});
