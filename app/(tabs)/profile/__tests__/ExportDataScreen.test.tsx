import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { mockAuthModule } from '@/test/authMocks';
import ExportDataScreen from '../export-data';

const mockDismiss = jest.fn();
const mockMutate = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    canDismiss: () => true,
    dismiss: (...args: unknown[]) => mockDismiss(...args),
    replace: jest.fn(),
  },
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

jest.mock('@/features/auth', () => mockAuthModule);

jest.mock('@/features/profile', () => ({
  useLatestExport: () => ({ data: null, isLoading: false }),
  useRequestExport: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: jest.fn(),
      }),
    },
  },
}));

describe('ExportDataScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders back button that calls router.dismiss(1)', () => {
    const { getByLabelText } = renderWithProviders(<ExportDataScreen />);
    const backButton = getByLabelText('Back');
    fireEvent.press(backButton);
    expect(mockDismiss).toHaveBeenCalledWith(1);
  });

  it('renders export title in the app bar', () => {
    const { getAllByText } = renderWithProviders(<ExportDataScreen />);
    expect(getAllByText('Export My Data').length).toBeGreaterThan(0);
  });

  it('renders request export button in ready state', () => {
    const { getAllByText } = renderWithProviders(<ExportDataScreen />);
    const exportButtons = getAllByText('Export My Data');
    // The last one is the action button (first is appbar title, second is heading)
    fireEvent.press(exportButtons[exportButtons.length - 1]);
    expect(mockMutate).toHaveBeenCalled();
  });
});
