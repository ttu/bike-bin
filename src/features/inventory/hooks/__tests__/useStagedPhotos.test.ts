import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ItemId } from '@/shared/types';

const mockUpload = jest.fn();
const mockInsert = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
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

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

// Mock fetch for blob creation
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import { useStagedPhotos } from '../useStagedPhotos';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('useStagedPhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with empty staged photos', () => {
    const { result } = renderHook(() => useStagedPhotos(), { wrapper: createWrapper() });
    expect(result.current.stagedPhotos).toEqual([]);
    expect(result.current.isUploading).toBe(false);
  });

  it('adds a staged photo', () => {
    const { result } = renderHook(() => useStagedPhotos(), { wrapper: createWrapper() });

    act(() => {
      result.current.addStaged('file:///photo.jpg', 'photo.jpg');
    });

    expect(result.current.stagedPhotos).toHaveLength(1);
    expect(result.current.stagedPhotos[0].localUri).toBe('file:///photo.jpg');
  });

  it('removes a staged photo', () => {
    const { result } = renderHook(() => useStagedPhotos(), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useStagedPhotos(), { wrapper: createWrapper() });

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
    const { result } = renderHook(() => useStagedPhotos(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.uploadAll('item-1' as ItemId);
    });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('throws on upload error', async () => {
    const mockBlob = new Blob(['test']);
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
    mockUpload.mockResolvedValue({ error: new Error('Upload failed') });

    const { result } = renderHook(() => useStagedPhotos(), { wrapper: createWrapper() });

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
