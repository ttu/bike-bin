import { renderHook, waitFor } from '@testing-library/react-native';
import { useMarkNotificationRead } from '../useMarkNotificationRead';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  },
}));


beforeEach(() => jest.clearAllMocks());

describe('useMarkNotificationRead', () => {
  it('marks a notification as read', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate('notif-1' as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('propagates errors', async () => {
    mockEq.mockResolvedValue({ error: { message: 'fail' } });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate('notif-1' as never);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
