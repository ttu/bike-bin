import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockBike } from '@/test/factories';
import {
  mockSelect,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockEq,
  mockOrder,
  mockSingle,
  mockSupabase,
} from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';
import { BikeType, ItemCondition, type BikeId } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

jest.mock('@/shared/utils/fetchFirstPhotoPaths', () => ({
  fetchFirstPhotoPaths: jest.fn().mockResolvedValue(new Map()),
}));

// Import after mocks
import {
  useBikes,
  useBike,
  useBikePhotos,
  useCreateBike,
  useUpdateBike,
  useDeleteBike,
} from '../useBikes';
import { fetchFirstPhotoPaths } from '@/shared/utils/fetchFirstPhotoPaths';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useBikes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchFirstPhotoPaths as jest.Mock).mockResolvedValue(new Map());
  });

  it('fetches bikes for the current user', async () => {
    const bike = createMockBike({ name: 'Road Bike' });
    const mockRow = {
      id: bike.id,
      owner_id: bike.ownerId,
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      created_at: bike.createdAt,
      updated_at: bike.updatedAt,
    };

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: [mockRow], error: null }),
      }),
    });

    renderHook(() => useBikes(), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('owner_id', 'user-123');
    expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('assigns thumbnailStoragePath from fetchFirstPhotoPaths', async () => {
    const bike = createMockBike();
    const mockRow = {
      id: bike.id,
      owner_id: bike.ownerId,
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      created_at: bike.createdAt,
      updated_at: bike.updatedAt,
    };
    const thumbMap = new Map([[bike.id, 'bikes/thumb.jpg']]);
    (fetchFirstPhotoPaths as jest.Mock).mockResolvedValue(thumbMap);

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: [mockRow], error: null }),
      }),
    });

    const { result } = renderHook(() => useBikes(), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data?.[0]?.thumbnailStoragePath).toBe('bikes/thumb.jpg');
  });

  it('throws on supabase error', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') }),
      }),
    });

    const { result } = renderHook(() => useBikes(), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.isError).toBe(true);
  });
});

describe('useBike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single bike by ID', async () => {
    const bike = createMockBike();
    const mockRow = {
      id: bike.id,
      owner_id: bike.ownerId,
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      created_at: bike.createdAt,
      updated_at: bike.updatedAt,
    };

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: mockRow, error: null }),
      }),
    });

    renderHook(() => useBike(bike.id), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', bike.id);
    expect(mockSingle).toHaveBeenCalled();
  });

  it('throws on supabase error', async () => {
    const bikeId = 'bike-err' as BikeId;

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: null, error: new Error('Not found') }),
      }),
    });

    const { result } = renderHook(() => useBike(bikeId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useBikePhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches photos for a bike', async () => {
    const bikeId = 'bike-photos-1' as BikeId;
    const photoRows = [
      {
        id: 'photo-1',
        bike_id: bikeId,
        storage_path: 'bikes/bike-photos-1/photo-1.jpg',
        sort_order: 0,
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: photoRows, error: null }),
      }),
    });

    renderHook(() => useBikePhotos(bikeId), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockEq).toHaveBeenCalledWith('bike_id', bikeId);
    expect(mockOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  it('maps rows to BikePhoto domain objects', async () => {
    const bikeId = 'bike-photos-2' as BikeId;
    const photoRows = [
      {
        id: 'photo-abc',
        bike_id: bikeId,
        storage_path: 'path/img.jpg',
        sort_order: 2,
        created_at: '2026-02-01T00:00:00Z',
      },
    ];

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: photoRows, error: null }),
      }),
    });

    const { result } = renderHook(() => useBikePhotos(bikeId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data?.[0]).toMatchObject({
      id: 'photo-abc',
      bikeId,
      storagePath: 'path/img.jpg',
      sortOrder: 2,
    });
  });

  it('throws on supabase error', async () => {
    const bikeId = 'bike-err' as BikeId;

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: null, error: new Error('Photos error') }),
      }),
    });

    const { result } = renderHook(() => useBikePhotos(bikeId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.isError).toBe(true);
  });
});

describe('useCreateBike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a bike and returns the mapped domain object', async () => {
    const bike = createMockBike({ name: 'My Gravel Bike' });
    const mockRow = {
      id: bike.id,
      owner_id: 'user-123',
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      created_at: bike.createdAt,
      updated_at: bike.updatedAt,
    };

    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: mockRow, error: null }),
      }),
    });

    const { result } = renderHook(() => useCreateBike(), {
      wrapper: createQueryClientHookWrapper(),
    });

    const created = await result.current.mutateAsync({
      name: 'My Gravel Bike',
      brand: 'Canyon',
      model: 'Grail',
      type: BikeType.Road,
      year: 2024,
      condition: ItemCondition.Good,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: 'user-123',
        name: 'My Gravel Bike',
        condition: ItemCondition.Good,
      }),
    );
    expect(created.name).toBe(bike.name);
  });

  it('throws on supabase error', async () => {
    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      }),
    });

    const { result } = renderHook(() => useCreateBike(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        name: 'Fail Bike',
        type: BikeType.MTB,
        condition: ItemCondition.Good,
      }),
    ).rejects.toThrow('Insert failed');
  });
});

describe('useUpdateBike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a bike and returns the mapped domain object', async () => {
    const bike = createMockBike({ name: 'Updated Bike' });
    const mockRow = {
      id: bike.id,
      owner_id: bike.ownerId,
      name: 'Updated Bike',
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      created_at: bike.createdAt,
      updated_at: bike.updatedAt,
    };

    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: mockRow, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateBike(), {
      wrapper: createQueryClientHookWrapper(),
    });

    const updated = await result.current.mutateAsync({
      id: bike.id,
      name: 'Updated Bike',
      type: BikeType.Road,
      condition: ItemCondition.Good,
    });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Bike' }));
    expect(mockEq).toHaveBeenCalledWith('id', bike.id);
    expect(updated.name).toBe('Updated Bike');
  });

  it('throws on supabase error', async () => {
    const bikeId = 'bike-upd-err' as BikeId;

    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: null, error: new Error('Update failed') }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateBike(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        id: bikeId,
        name: 'X',
        type: BikeType.MTB,
        condition: ItemCondition.Good,
      }),
    ).rejects.toThrow('Update failed');
  });
});

describe('useDeleteBike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a bike by ID', async () => {
    mockDelete.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useDeleteBike(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync('bike-del-1' as BikeId);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'bike-del-1');
  });

  it('throws on supabase error', async () => {
    mockDelete.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: new Error('Delete failed') }),
    });

    const { result } = renderHook(() => useDeleteBike(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(result.current.mutateAsync('bike-del-2' as BikeId)).rejects.toThrow(
      'Delete failed',
    );
  });
});
