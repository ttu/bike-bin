import { renderHook, act } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';
import type { ItemId } from '@/shared/types';

const mockUpload = jest.fn();
const mockInsert = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
      }),
    },
    from: () => ({
      insert: (...args: unknown[]) => mockInsert(...args),
    }),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

// Mock fetch for blob creation
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

import { useStagedPhotos } from '../useStagedPhotos';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useStagedPhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const { result } = renderHook(() => useStagedPhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.stagedPhotos).toEqual([]);
    expect(result.current.isUploading).toBe(false);
  });

  it('adds a staged photo', () => {
    const { result } = renderHook(() => useStagedPhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo.jpg', 'photo.jpg');
    });

    expect(result.current.stagedPhotos).toHaveLength(1);
    expect(result.current.stagedPhotos[0].localUri).toBe('file:///photo.jpg');
  });

  it('removes a staged photo', () => {
    const { result } = renderHook(() => useStagedPhotos(), {
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

  it('uploads all staged photos', async () => {
    const mockBlob = new Blob(['test']);
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
    mockUpload.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useStagedPhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await act(async () => {
      await result.current.uploadAll('item-1' as ItemId);
    });

    expect(mockUpload).toHaveBeenCalledWith('items/user-123/item-1/photo1.jpg', mockBlob, {
      contentType: 'image/jpeg',
    });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('does nothing when no photos to upload', async () => {
    const { result } = renderHook(() => useStagedPhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.uploadAll('item-1' as ItemId);
    });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('throws on upload error', async () => {
    const mockBlob = new Blob(['test']);
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
    mockUpload.mockResolvedValue({ error: new Error('Upload failed') });

    const { result } = renderHook(() => useStagedPhotos(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.addStaged('file:///photo1.jpg', 'photo1.jpg');
    });

    await expect(
      act(async () => {
        await result.current.uploadAll('item-1' as ItemId);
      }),
    ).rejects.toThrow('Upload failed');
  });
});
