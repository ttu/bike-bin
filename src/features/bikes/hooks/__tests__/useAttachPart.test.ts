import { renderHook } from '@testing-library/react-native';
import { createMockItem } from '@/test/factories';
import { ItemStatus } from '@/shared/types';
import type { ItemId, BikeId } from '@/shared/types';
import { useAttachPart } from '../useAttachPart';
import { useDetachPart } from '../useDetachPart';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

// Mock supabase
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

describe('useAttachPart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates item with bike_id and mounted status', async () => {
    const item = createMockItem({ status: ItemStatus.Stored });
    const attachedItem = { ...item, bikeId: 'bike-1', status: ItemStatus.Mounted };

    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: attachedItem, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useAttachPart(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({
      itemId: item.id,
      bikeId: 'bike-1' as BikeId,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      bike_id: 'bike-1',
      status: ItemStatus.Mounted,
    });
    expect(mockEq).toHaveBeenCalledWith('id', item.id);
  });

  it('throws on supabase error', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({
            data: null,
            error: new Error('RLS violation'),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useAttachPart(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        itemId: 'item-1' as ItemId,
        bikeId: 'bike-1' as BikeId,
      }),
    ).rejects.toThrow('RLS violation');
  });
});

describe('useDetachPart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears bike_id and sets stored status', async () => {
    const item = createMockItem({ status: ItemStatus.Mounted });
    const detachedItem = { ...item, bikeId: undefined, status: ItemStatus.Stored };

    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: detachedItem, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useDetachPart(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({
      itemId: item.id,
      bikeId: 'bike-1' as BikeId,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      bike_id: null,
      status: ItemStatus.Stored,
    });
    expect(mockEq).toHaveBeenCalledWith('id', item.id);
  });

  it('throws on supabase error', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useDetachPart(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        itemId: 'item-1' as ItemId,
        bikeId: 'bike-1' as BikeId,
      }),
    ).rejects.toThrow('Not found');
  });
});
