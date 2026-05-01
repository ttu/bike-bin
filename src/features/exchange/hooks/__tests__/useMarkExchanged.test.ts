import { renderHook, waitFor } from '@testing-library/react-native';
import { mockUpdate, mockEq, mockSupabase } from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';
import { ItemStatus, type ItemId } from '@/shared/types';
import { NotAuthenticatedError } from '@/shared/utils/subscriptionLimitErrors';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

// Import after mocks
import { useMarkExchanged } from '../useMarkExchanged';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

describe('useMarkExchanged("donate")', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates item status to donated', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useMarkExchanged('donate'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({ itemId: 'item-1' as ItemId });

    expect(mockUpdate).toHaveBeenCalledWith({ status: ItemStatus.Donated });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });

  it('throws when supabase returns an error', async () => {
    const supabaseError = { message: 'Not found', code: 'PGRST116' };
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: supabaseError }),
    });

    const { result } = renderHook(() => useMarkExchanged('donate'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(result.current.mutateAsync({ itemId: 'item-1' as ItemId })).rejects.toEqual(
      supabaseError,
    );
  });

  it('throws when user is not authenticated', async () => {
    const useAuthMock = jest.requireMock('@/features/auth');
    const originalAuth = useAuthMock.useAuth;
    useAuthMock.useAuth = () => ({ user: null, isAuthenticated: false });

    const { result } = renderHook(() => useMarkExchanged('donate'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(result.current.mutateAsync({ itemId: 'item-1' as ItemId })).rejects.toThrow(
      NotAuthenticatedError,
    );

    useAuthMock.useAuth = originalAuth;
  });

  it('invalidates relevant query keys on success', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMarkExchanged('donate'), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    await result.current.mutateAsync({ itemId: 'item-1' as ItemId });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['group-items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['search', 'items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversation'] });
    });
  });
});

describe('useMarkExchanged("sell")', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates item status to sold', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useMarkExchanged('sell'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({ itemId: 'item-2' as ItemId });

    expect(mockUpdate).toHaveBeenCalledWith({ status: ItemStatus.Sold });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-2');
  });

  it('throws when supabase returns an error', async () => {
    const supabaseError = { message: 'Not found', code: 'PGRST116' };
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: supabaseError }),
    });

    const { result } = renderHook(() => useMarkExchanged('sell'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(result.current.mutateAsync({ itemId: 'item-2' as ItemId })).rejects.toEqual(
      supabaseError,
    );
  });

  it('throws when user is not authenticated', async () => {
    const useAuthMock = jest.requireMock('@/features/auth');
    const originalAuth = useAuthMock.useAuth;
    useAuthMock.useAuth = () => ({ user: null, isAuthenticated: false });

    const { result } = renderHook(() => useMarkExchanged('sell'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(result.current.mutateAsync({ itemId: 'item-2' as ItemId })).rejects.toThrow(
      NotAuthenticatedError,
    );

    useAuthMock.useAuth = originalAuth;
  });

  it('invalidates relevant query keys on success', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMarkExchanged('sell'), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    await result.current.mutateAsync({ itemId: 'item-2' as ItemId });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['group-items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['search', 'items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversation'] });
    });
  });
});
