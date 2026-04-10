import { renderHook } from '@testing-library/react-native';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockUseAuth = jest.fn();
jest.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseItems = jest.fn();
jest.mock('../useItems', () => ({
  useItems: () => mockUseItems(),
}));

const mockUseMyInventoryItemLimit = jest.fn();
jest.mock('../useMyInventoryItemLimit', () => ({
  useMyInventoryItemLimit: () => mockUseMyInventoryItemLimit(),
}));

import { useInventoryRowCapacity } from '../useInventoryRowCapacity';

describe('useInventoryRowCapacity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      isAuthenticated: true,
    });
    mockUseItems.mockReturnValue({
      data: [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }],
      isLoading: false,
      isError: false,
    });
    mockUseMyInventoryItemLimit.mockReturnValue({
      data: 100,
      isLoading: false,
    });
  });

  it('returns not at limit when item count is below limit', () => {
    const { result } = renderHook(() => useInventoryRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.atLimit).toBe(false);
    expect(result.current.itemRowCount).toBe(3);
    expect(result.current.limit).toBe(100);
    expect(result.current.isReady).toBe(true);
  });

  it('returns at limit when item count equals limit', () => {
    mockUseMyInventoryItemLimit.mockReturnValue({ data: 3, isLoading: false });

    const { result } = renderHook(() => useInventoryRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.atLimit).toBe(true);
    expect(result.current.itemRowCount).toBe(3);
    expect(result.current.limit).toBe(3);
  });

  it('returns not ready while items are loading', () => {
    mockUseItems.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    const { result } = renderHook(() => useInventoryRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.isReady).toBe(false);
    expect(result.current.atLimit).toBe(false);
  });

  it('returns not ready while limit is loading', () => {
    mockUseMyInventoryItemLimit.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useInventoryRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.isReady).toBe(false);
  });

  it('returns not ready on items error', () => {
    mockUseItems.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    const { result } = renderHook(() => useInventoryRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.isReady).toBe(false);
    expect(result.current.itemRowCount).toBe(0);
  });

  it('returns defaults for unauthenticated user', () => {
    mockUseAuth.mockReturnValue({ user: undefined, isAuthenticated: false });

    const { result } = renderHook(() => useInventoryRowCapacity(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.atLimit).toBe(false);
    expect(result.current.itemRowCount).toBe(0);
    expect(result.current.limit).toBeUndefined();
    expect(result.current.isReady).toBe(true);
  });
});
