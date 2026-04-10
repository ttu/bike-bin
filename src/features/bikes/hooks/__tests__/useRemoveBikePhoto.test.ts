import { renderHook, act } from '@testing-library/react-native';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockEq = jest.fn();
const mockStorageRemove = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
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

import type { BikeId } from '@/shared/types';
import { useRemoveBikePhoto } from '../useBikePhotoManagement';

describe('useRemoveBikePhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
  });

  it('removes photo from storage and database', async () => {
    const { result } = renderHook(() => useRemoveBikePhoto(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        bikeId: 'bike-1' as BikeId,
        photoId: 'photo-1',
        storagePath: 'bikes/user-123/bike-1/photo.jpg',
      });
    });

    expect(mockStorageRemove).toHaveBeenCalledWith(['bikes/user-123/bike-1/photo.jpg']);
    expect(mockEq).toHaveBeenCalledWith('id', 'photo-1');
  });
});
