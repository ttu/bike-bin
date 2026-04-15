import { renderHook, waitFor } from '@testing-library/react-native';
import { mockRpc } from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));
jest.mock('@/features/auth', () => mockAuthModule);

// Import after mocks
import { useBorrowTransition } from '../useBorrowTransition';
import {
  createTestQueryClient,
  createQueryClientHookWrapperWithClient,
} from '@/test/queryTestUtils';

beforeEach(() => jest.clearAllMocks());

describe('useBorrowTransition onSuccess invalidations', () => {
  it('invalidates items, group-items, search, and borrow-requests caches', async () => {
    mockRpc.mockResolvedValue({ data: { id: 'req-1' }, error: null });

    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () =>
        useBorrowTransition({
          newRequestStatus: 'accepted',
          newItemStatus: 'loaned',
        }),
      { wrapper: createQueryClientHookWrapperWithClient(queryClient) },
    );

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([['borrowRequests'], ['items'], ['group-items'], ['search', 'items']]),
    );
  });
});
