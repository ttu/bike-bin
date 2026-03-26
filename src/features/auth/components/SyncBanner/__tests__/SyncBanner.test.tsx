import { renderWithProviders } from '@/test/utils';
import { SyncBanner } from '../SyncBanner';

const mockUseAuth = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

describe('SyncBanner', () => {
  it('renders banner when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { getByText } = renderWithProviders(<SyncBanner />);
    expect(getByText(/saved on this device/i)).toBeTruthy();
  });

  it('does not render banner when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    const { queryByText } = renderWithProviders(<SyncBanner />);
    expect(queryByText(/saved on this device/i)).toBeNull();
  });
});
