import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { SyncBanner } from '../SyncBanner';

const mockUseAuth = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

describe('SyncBanner', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders banner when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { getByText } = renderWithProviders(<SyncBanner />);
    expect(getByText(/on this device only/i)).toBeTruthy();
    expect(getByText(/sign in to sync/i)).toBeTruthy();
  });

  it('does not render banner when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    const { queryByText } = renderWithProviders(<SyncBanner />);
    expect(queryByText(/on this device only/i)).toBeNull();
  });

  it('navigates to login when the sign-in link is pressed', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { getByText } = renderWithProviders(<SyncBanner />);
    fireEvent.press(getByText(/sign in to sync/i));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login');
  });
});
