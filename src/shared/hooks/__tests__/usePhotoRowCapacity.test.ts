import { renderHook, waitFor } from '@testing-library/react-native';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockRpc = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const mockUseAuth = jest.fn();
jest.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { usePhotoRowCapacity } from '../usePhotoRowCapacity';

describe('usePhotoRowCapacity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      isAuthenticated: true,
    });
    mockRpc.mockImplementation((name: string) => {
      if (name === 'get_my_photo_limit') {
        return Promise.resolve({ data: 100, error: null });
      }
      if (name === 'get_my_photo_count') {
        return Promise.resolve({ data: 5, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  it('returns not at limit when count is below limit', async () => {
    const { result } = renderHook(() => usePhotoRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.atLimit).toBe(false);
    expect(result.current.photoRowCount).toBe(5);
    expect(result.current.limit).toBe(100);
  });

  it('returns at limit when count equals limit', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'get_my_photo_limit') {
        return Promise.resolve({ data: 10, error: null });
      }
      if (name === 'get_my_photo_count') {
        return Promise.resolve({ data: 10, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => usePhotoRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.atLimit).toBe(true);
    expect(result.current.photoRowCount).toBe(10);
    expect(result.current.limit).toBe(10);
  });

  it('returns defaults for unauthenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: undefined,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => usePhotoRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.atLimit).toBe(false);
    expect(result.current.photoRowCount).toBe(0);
    expect(result.current.limit).toBeUndefined();
    expect(result.current.isReady).toBe(true);
  });
});
