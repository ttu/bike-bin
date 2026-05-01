import { renderHook } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';

const mockEq2 = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSubscribe = jest.fn().mockReturnValue({});
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = jest.fn().mockReturnValue({ on: mockOn });
const mockRemoveChannel = jest.fn().mockResolvedValue('ok');

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: (...args: unknown[]) => mockSelect(...args),
    })),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

import { useUnreadNotificationCount } from '../useUnreadNotificationCount';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

describe('useUnreadNotificationCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches unread count and subscribes to realtime', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ count: 5, error: null }),
      }),
    });

    renderHook(() => useUnreadNotificationCount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(mockChannel).toHaveBeenCalledWith('unread-notifications');
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('invalidates unread count on insert event', () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ count: 0, error: null }),
      }),
    });
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    renderHook(() => useUnreadNotificationCount(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    const listener = mockOn.mock.calls[0][2] as () => void;
    listener();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['unread_notification_count', 'user-123'],
    });
  });

  it('swallows invalidate errors when listener fires', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ count: 0, error: null }),
      }),
    });
    const queryClient = createTestQueryClient();
    jest.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('boom'));

    renderHook(() => useUnreadNotificationCount(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    const listener = mockOn.mock.calls[0][2] as () => void;
    expect(() => listener()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

  it('swallows removeChannel errors on unmount', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ count: 0, error: null }),
      }),
    });
    mockRemoveChannel.mockRejectedValueOnce(new Error('boom'));

    const { unmount } = renderHook(() => useUnreadNotificationCount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(() => unmount()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});
