import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { OfflineBanner } from '../OfflineBanner';

const mockUseNetworkStatus = jest.fn();
jest.mock('@/shared/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

describe('OfflineBanner', () => {
  it('renders when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    const { getByText } = renderWithProviders(<OfflineBanner />);
    expect(getByText(/offline/i)).toBeTruthy();
  });

  it('does not render when online', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    const { queryByText } = renderWithProviders(<OfflineBanner />);
    expect(queryByText(/offline/i)).toBeNull();
  });

  it('dismisses when close button pressed', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    const { getByLabelText, queryByText } = renderWithProviders(<OfflineBanner />);
    fireEvent.press(getByLabelText('Dismiss'));
    expect(queryByText(/offline/i)).toBeNull();
  });
});
