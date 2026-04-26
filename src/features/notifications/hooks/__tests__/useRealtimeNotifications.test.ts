import { renderHook } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';

const mockSubscribe = jest.fn().mockReturnValue({});
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannelObj = { on: mockOn };
const mockChannel = jest.fn().mockReturnValue(mockChannelObj);
const mockRemoveChannel = jest.fn().mockResolvedValue('ok');

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

import { useRealtimeNotifications } from '../useRealtimeNotifications';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

describe('useRealtimeNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('invalidates notifications and unread count on insert event', () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    renderHook(() => useRealtimeNotifications(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    const listener = mockOn.mock.calls[0][2] as () => void;
    listener();

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it('swallows invalidate errors when listener fires', async () => {
    const queryClient = createTestQueryClient();
    jest.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('boom'));

    renderHook(() => useRealtimeNotifications(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    const listener = mockOn.mock.calls[0][2] as () => void;
    expect(() => listener()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

  it('swallows removeChannel errors on unmount', async () => {
    mockRemoveChannel.mockRejectedValueOnce(new Error('boom'));

    const { unmount } = renderHook(() => useRealtimeNotifications(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(() => unmount()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

  it('subscribes to notification inserts for current user', () => {
    renderHook(() => useRealtimeNotifications(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(mockChannel).toHaveBeenCalledWith('notifications:user-123');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        table: 'notifications',
        filter: 'user_id=eq.user-123',
      }),
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('cleans up channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeNotifications(), {
      wrapper: createQueryClientHookWrapper(),
    });

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
