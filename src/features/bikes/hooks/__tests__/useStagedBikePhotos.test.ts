import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { BikeId } from '@/shared/types';
import { PhotoLimitExceededError } from '@/shared/utils/subscriptionLimitErrors';

const mockUploadPhoto = jest.fn();
const mockRpc = jest.fn();
const mockStorageRemove = jest.fn().mockResolvedValue({ data: [], error: null });
const mockDeleteIn = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('@/shared/utils/uploadPhoto', () => ({
  uploadPhoto: (...args: unknown[]) => mockUploadPhoto(...args),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    storage: {
      from: () => ({
        remove: (...args: unknown[]) => mockStorageRemove(...args),
      }),
    },
    from: () => ({
      delete: () => ({
        in: (...args: unknown[]) => mockDeleteIn(...args),
      }),
    }),
  },
}));

const authState: { user: { id: string } | undefined } = { user: { id: 'user-123' } };

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: authState.user,
    isAuthenticated: authState.user !== undefined,
  }),
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

import { useStagedBikePhotos } from '../useStagedBikePhotos';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useStagedBikePhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadPhoto.mockReset();
    mockStorageRemove.mockResolvedValue({ data: [], error: null });
    authState.user = { id: 'user-123' };
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_my_photo_limit') {
        return Promise.resolve({ data: 10_000, error: null });
      }
      if (fn === 'get_my_photo_count') {
        return Promise.resolve({ data: 0, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  it('starts with empty staged photos', () => {
    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.stagedPhotos).toEqual([]);
    expect(result.current.isUploading).toBe(false);
  });

  it('adds a staged photo', () => {
    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo.jpg', 'photo.jpg');
    });

    expect(result.current.stagedPhotos).toHaveLength(1);
    expect(result.current.stagedPhotos[0].localUri).toBe('file:///photo.jpg');
    expect(result.current.stagedPhotos[0].id).toMatch(/^staged-/);
  });

  it('removes a staged photo', () => {
    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo.jpg', 'photo.jpg');
    });

    const id = result.current.stagedPhotos[0].id;

    act(() => {
      result.current.removeStaged(id);
    });

    expect(result.current.stagedPhotos).toHaveLength(0);
  });

  it('uploads all staged photos for the bike', async () => {
    mockUploadPhoto.mockResolvedValue('bikes/user-123/bike-1/photo1.jpg');

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await act(async () => {
      await result.current.uploadAll('bike-1' as BikeId);
    });

    expect(mockUploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: 'item-photos',
        storagePath: 'bikes/user-123/bike-1/photo1.jpg',
        table: 'bike_photos',
        entityIdColumn: 'bike_id',
        entityId: 'bike-1',
        sortOrder: 1,
      }),
    );
  });

  it('uploads multiple photos in order', async () => {
    mockUploadPhoto.mockResolvedValue('path');

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///a.jpg', 'a.jpg');
    });
    act(() => {
      result.current.addStaged('file:///b.jpg', 'b.jpg');
    });

    await act(async () => {
      await result.current.uploadAll('bike-2' as BikeId);
    });

    expect(mockUploadPhoto).toHaveBeenCalledTimes(2);
    expect(mockUploadPhoto).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ storagePath: 'bikes/user-123/bike-2/a.jpg', sortOrder: 1 }),
    );
    expect(mockUploadPhoto).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ storagePath: 'bikes/user-123/bike-2/b.jpg', sortOrder: 2 }),
    );
  });

  it('does nothing when no photos to upload', async () => {
    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.uploadAll('bike-1' as BikeId);
    });

    expect(mockUploadPhoto).not.toHaveBeenCalled();
  });

  it('does nothing when user is not authenticated', async () => {
    authState.user = undefined;

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await act(async () => {
      await result.current.uploadAll('bike-1' as BikeId);
    });

    expect(mockUploadPhoto).not.toHaveBeenCalled();
  });

  it('throws when get_my_photo_limit RPC fails', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_my_photo_limit') {
        return Promise.resolve({ data: null, error: new Error('rpc failed') });
      }
      if (fn === 'get_my_photo_count') {
        return Promise.resolve({ data: 0, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await expect(
      act(async () => {
        await result.current.uploadAll('bike-1' as BikeId);
      }),
    ).rejects.toThrow('rpc failed');
  });

  it('throws when get_my_photo_count RPC fails', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_my_photo_limit') {
        return Promise.resolve({ data: 10_000, error: null });
      }
      if (fn === 'get_my_photo_count') {
        return Promise.resolve({ data: null, error: new Error('count failed') });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await expect(
      act(async () => {
        await result.current.uploadAll('bike-1' as BikeId);
      }),
    ).rejects.toThrow('count failed');
  });

  it('throws PhotoLimitExceededError when account cap would be exceeded', async () => {
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'get_my_photo_limit') {
        return Promise.resolve({ data: 5, error: null });
      }
      if (fn === 'get_my_photo_count') {
        return Promise.resolve({ data: 5, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await expect(
      act(async () => {
        await result.current.uploadAll('bike-1' as BikeId);
      }),
    ).rejects.toThrow(PhotoLimitExceededError);
  });

  it('propagates uploadPhoto errors', async () => {
    mockUploadPhoto.mockRejectedValue(new Error('upload failed'));

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await expect(
      act(async () => {
        await result.current.uploadAll('bike-1' as BikeId);
      }),
    ).rejects.toThrow('upload failed');
  });

  it('removes storage objects uploaded before a later upload failure', async () => {
    mockUploadPhoto
      .mockResolvedValueOnce('bikes/user-123/bike-2/a.jpg')
      .mockRejectedValueOnce(new Error('second failed'));

    const { result } = renderHook(() => useStagedBikePhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///a.jpg', 'a.jpg');
    });
    act(() => {
      result.current.addStaged('file:///b.jpg', 'b.jpg');
    });

    await waitFor(() => {
      expect(result.current.stagedPhotos).toHaveLength(2);
    });

    let uploadAllPromise: Promise<void>;
    act(() => {
      uploadAllPromise = result.current.uploadAll('bike-2' as BikeId);
    });

    await expect(uploadAllPromise!).rejects.toThrow('second failed');

    expect(mockUploadPhoto).toHaveBeenCalledTimes(2);
    expect(mockDeleteIn).toHaveBeenCalledWith('storage_path', ['bikes/user-123/bike-2/a.jpg']);
    expect(mockStorageRemove).toHaveBeenCalledWith(['bikes/user-123/bike-2/a.jpg']);
  });
});
