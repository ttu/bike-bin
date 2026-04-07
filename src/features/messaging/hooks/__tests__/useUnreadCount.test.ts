import { renderHook, waitFor } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

// Import after mocks
import { useUnreadCount } from '../useUnreadCount';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useUnreadCount', () => {
  it('returns 0 for MVP implementation', async () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('does not create any realtime subscriptions', () => {
    const mockChannel = jest.fn();
    jest.mock('@/shared/api/supabase', () => ({
      supabase: { channel: mockChannel },
    }));

    renderHook(() => useUnreadCount(), { wrapper: createQueryClientHookWrapper() });

    expect(mockChannel).not.toHaveBeenCalled();
  });
});
