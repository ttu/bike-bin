import { renderHook } from '@testing-library/react-native';
import { createMockItem } from '@/test/factories';
import { mockSelect, mockUpdate, mockEq, mockSingle, mockSupabase } from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';
import { ItemStatus, type BikeId, type ItemId } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

// Import after mocks
import { useAttachPart } from '../useAttachPart';
import { useDetachPart } from '../useDetachPart';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

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
