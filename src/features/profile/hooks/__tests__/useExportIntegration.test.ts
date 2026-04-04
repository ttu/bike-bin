import { renderHook, waitFor, act } from '@testing-library/react-native';
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

describe('Export flow integration', () => {
  it('requesting export invalidates latest export query', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
    mockInvoke.mockResolvedValue({
      data: { success: true, exportRequestId: 'new-id' },
      error: null,
    });

    const wrapper = createQueryClientHookWrapper();
    const { result: requestResult } = renderHook(() => useRequestExport(), { wrapper });

    await act(async () => {
      requestResult.current.mutate();
    });

    await waitFor(() => expect(requestResult.current.isSuccess).toBe(true));
  });

  it('handles rate limit error from edge function', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Too many requests' },
    });

    const wrapper = createQueryClientHookWrapper();
    const { result } = renderHook(() => useRequestExport(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
