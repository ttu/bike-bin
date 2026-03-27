import { renderHook, waitFor } from '@testing-library/react-native';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';
import { useMarkDonated } from '../useMarkDonated';
import { useMarkSold } from '../useMarkSold';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

// Mock supabase
const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

// Mock useAuth
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));


describe('useMarkDonated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates item status to donated', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useMarkDonated(), { wrapper: createQueryClientHookWrapper() });

    await result.current.mutateAsync({ itemId: 'item-1' as ItemId });

    expect(mockUpdate).toHaveBeenCalledWith({ status: ItemStatus.Donated });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });

  it('accepts optional recipientId param', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useMarkDonated(), { wrapper: createQueryClientHookWrapper() });

    await result.current.mutateAsync({
      itemId: 'item-1' as ItemId,
      recipientId: 'recipient-456',
    });

    expect(mockUpdate).toHaveBeenCalledWith({ status: ItemStatus.Donated });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });

  it('throws when supabase returns an error', async () => {
    const supabaseError = { message: 'Not found', code: 'PGRST116' };
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: supabaseError }),
    });

    const { result } = renderHook(() => useMarkDonated(), { wrapper: createQueryClientHookWrapper() });

    await expect(result.current.mutateAsync({ itemId: 'item-1' as ItemId })).rejects.toEqual(
      supabaseError,
    );
  });

  it('throws when user is not authenticated', async () => {
    // Override the auth mock for this test
    const useAuthMock = jest.requireMock('@/features/auth') as {
      useAuth: () => { user: null; isAuthenticated: boolean };
    };
    const originalAuth = useAuthMock.useAuth;
    useAuthMock.useAuth = () => ({ user: null, isAuthenticated: false });

    const { result } = renderHook(() => useMarkDonated(), { wrapper: createQueryClientHookWrapper() });

    await expect(result.current.mutateAsync({ itemId: 'item-1' as ItemId })).rejects.toThrow(
      'Not authenticated',
    );

    useAuthMock.useAuth = originalAuth;
  });

  it('invalidates relevant query keys on success', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMarkDonated(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    await result.current.mutateAsync({ itemId: 'item-1' as ItemId });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items', 'item-1'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['searchItems'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations'] });
    });
  });
});

describe('useMarkSold', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates item status to sold', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useMarkSold(), { wrapper: createQueryClientHookWrapper() });

    await result.current.mutateAsync({ itemId: 'item-2' as ItemId });

    expect(mockUpdate).toHaveBeenCalledWith({ status: ItemStatus.Sold });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-2');
  });

  it('accepts optional buyerId param', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useMarkSold(), { wrapper: createQueryClientHookWrapper() });

    await result.current.mutateAsync({
      itemId: 'item-2' as ItemId,
      buyerId: 'buyer-789',
    });

    expect(mockUpdate).toHaveBeenCalledWith({ status: ItemStatus.Sold });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-2');
  });

  it('throws when supabase returns an error', async () => {
    const supabaseError = { message: 'Not found', code: 'PGRST116' };
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: supabaseError }),
    });

    const { result } = renderHook(() => useMarkSold(), { wrapper: createQueryClientHookWrapper() });

    await expect(result.current.mutateAsync({ itemId: 'item-2' as ItemId })).rejects.toEqual(
      supabaseError,
    );
  });

  it('throws when user is not authenticated', async () => {
    const useAuthMock = jest.requireMock('@/features/auth') as {
      useAuth: () => { user: null; isAuthenticated: boolean };
    };
    const originalAuth = useAuthMock.useAuth;
    useAuthMock.useAuth = () => ({ user: null, isAuthenticated: false });

    const { result } = renderHook(() => useMarkSold(), { wrapper: createQueryClientHookWrapper() });

    await expect(result.current.mutateAsync({ itemId: 'item-2' as ItemId })).rejects.toThrow(
      'Not authenticated',
    );

    useAuthMock.useAuth = originalAuth;
  });

  it('invalidates relevant query keys on success', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMarkSold(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    await result.current.mutateAsync({ itemId: 'item-2' as ItemId });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items', 'item-2'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['searchItems'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations'] });
    });
  });
});
