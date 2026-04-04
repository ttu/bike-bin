import { renderHook, waitFor } from '@testing-library/react-native';
import { useRequestExport } from '../useRequestExport';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockGetSession = jest.fn();
const mockInvoke = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('useRequestExport', () => {
  it('calls request-export edge function with auth token', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
    mockInvoke.mockResolvedValue({
      data: { success: true, exportRequestId: 'test-id' },
      error: null,
    });

    const { result } = renderHook(() => useRequestExport(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInvoke).toHaveBeenCalledWith('request-export');
  });

  it('throws when not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useRequestExport(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not authenticated');
  });
});
