import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import NotificationSettingsScreen from '../notification-settings';

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockUpdatePreferences = jest.fn();

jest.mock('@/features/notifications', () => ({
  useNotificationPreferences: () => ({
    preferences: {
      messages: { push: true, email: false },
      borrowActivity: { push: true, email: true },
      reminders: { push: false, email: true },
    },
    isLoading: false,
    updatePreferences: mockUpdatePreferences,
  }),
}));

describe('NotificationSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
