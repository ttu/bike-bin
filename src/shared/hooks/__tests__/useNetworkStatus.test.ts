import { renderHook, act } from '@testing-library/react-native';

type MockNetInfoState = { isConnected: boolean | null };
type MockNetInfoListener = (state: MockNetInfoState) => void;

// Store listener and unsubscribe outside mock factory so tests can interact with them
let mockCapturedListener: MockNetInfoListener | null = null;
let mockCapturedUnsubscribe: jest.Mock | null = null;

jest.mock('@react-native-community/netinfo', () => {
  const mockUnsubscribe = jest.fn(() => {
    mockCapturedListener = null;
  });
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn((mockListener: MockNetInfoListener) => {
        mockCapturedListener = mockListener;
        mockCapturedUnsubscribe = mockUnsubscribe;
        mockUnsubscribe.mockClear();
        return mockUnsubscribe;
      }),
    },
  };
});

// Import after mocks
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCapturedListener = null;
    mockCapturedUnsubscribe = null;
  });

  it('starts with isOnline true by default', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
  });

  it('subscribes to NetInfo on mount', () => {
    renderHook(() => useNetworkStatus());

    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('updates isOnline to false when connection is lost', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockCapturedListener?.({ isConnected: false });
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates isOnline to true when connection is restored', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockCapturedListener?.({ isConnected: false });
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      mockCapturedListener?.({ isConnected: true });
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('defaults to true when isConnected is null', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockCapturedListener?.({ isConnected: null });
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('unsubscribes from NetInfo on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    expect(mockCapturedUnsubscribe).toBeDefined();
    unmount();

    expect(mockCapturedUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
