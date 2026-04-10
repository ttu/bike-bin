import { renderHook } from '@testing-library/react-native';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockUseAuth = jest.fn();
jest.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseBikes = jest.fn();
jest.mock('../useBikes', () => ({
  useBikes: () => mockUseBikes(),
}));

const mockUseMyBikeLimit = jest.fn();
jest.mock('../useMyBikeLimit', () => ({
  useMyBikeLimit: () => mockUseMyBikeLimit(),
}));

import { useBikeRowCapacity } from '../useBikeRowCapacity';

describe('useBikeRowCapacity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      isAuthenticated: true,
    });
    mockUseBikes.mockReturnValue({
      data: [{ id: 'bike-1' }, { id: 'bike-2' }],
      isLoading: false,
    });
    mockUseMyBikeLimit.mockReturnValue({
      data: 10,
      isLoading: false,
    });
  });

  it('returns not at limit when bike count is below limit', () => {
    const { result } = renderHook(() => useBikeRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.atLimit).toBe(false);
    expect(result.current.bikeRowCount).toBe(2);
    expect(result.current.limit).toBe(10);
    expect(result.current.isReady).toBe(true);
  });

  it('returns at limit when bike count equals limit', () => {
    mockUseMyBikeLimit.mockReturnValue({ data: 2, isLoading: false });

    const { result } = renderHook(() => useBikeRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.atLimit).toBe(true);
    expect(result.current.bikeRowCount).toBe(2);
    expect(result.current.limit).toBe(2);
  });

  it('returns not ready while loading', () => {
    mockUseBikes.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useBikeRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.isReady).toBe(false);
    expect(result.current.atLimit).toBe(false);
  });

  it('returns defaults for unauthenticated user', () => {
    mockUseAuth.mockReturnValue({ user: undefined, isAuthenticated: false });

    const { result } = renderHook(() => useBikeRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.atLimit).toBe(false);
    expect(result.current.bikeRowCount).toBe(0);
    expect(result.current.limit).toBeUndefined();
    expect(result.current.isReady).toBe(true);
  });
});
