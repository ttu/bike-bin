import { renderHook, act } from '@testing-library/react-native';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockStorageRemove = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: mockEq };
      },
      delete: () => ({
        eq: mockEq,
      }),
    })),
    storage: {
      from: () => ({
        remove: mockStorageRemove,
      }),
    },
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

import type { ItemId } from '@/shared/types';
import { useSwapItemPhotoOrder, useRemoveItemPhoto } from '../useItemPhotoManagement';

describe('useSwapItemPhotoOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it('calls supabase to swap photo sort orders', async () => {
    const { result } = renderHook(() => useSwapItemPhotoOrder(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        itemId: 'item-1' as ItemId,
        photoIdA: 'photo-a',
        sortOrderA: 1,
        photoIdB: 'photo-b',
        sortOrderB: 2,
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 2 });
    expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 1 });
  });
});

describe('useRemoveItemPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
  });

  it('removes photo from storage and database', async () => {
    const { result } = renderHook(() => useRemoveItemPhoto(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        itemId: 'item-1' as ItemId,
        photoId: 'photo-1',
        storagePath: 'items/user-123/item-1/photo.jpg',
      });
    });

    expect(mockStorageRemove).toHaveBeenCalledWith(['items/user-123/item-1/photo.jpg']);
  });
});
