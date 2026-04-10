import { renderHook, waitFor } from '@testing-library/react-native';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockRpc = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

import { useMyInventoryItemLimit } from '../useMyInventoryItemLimit';

describe('useMyInventoryItemLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({ data: 200, error: null });
  });

  it('returns the inventory item limit from rpc', async () => {
    const { result } = renderHook(() => useMyInventoryItemLimit(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith('get_my_inventory_item_limit');
  });

  it('throws when rpc returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc failed' } });

    const { result } = renderHook(() => useMyInventoryItemLimit(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('throws when rpc returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useMyInventoryItemLimit(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
