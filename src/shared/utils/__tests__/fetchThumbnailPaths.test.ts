import { mockSelect, mockIn, mockOrder, mockSupabase } from '@/test/supabaseMocks';
import type { ItemId } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));

// Import after mocks
import { fetchThumbnailPaths } from '../fetchThumbnailPaths';

describe('fetchThumbnailPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ in: mockIn });
    mockIn.mockReturnValue({ order: mockOrder });
  });

  it('returns a map of itemId to storage path', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { item_id: 'item-1', storage_path: 'photos/1.jpg' },
        { item_id: 'item-2', storage_path: 'photos/2.jpg' },
      ],
      error: null,
    });

    const result = await fetchThumbnailPaths(['item-1' as ItemId, 'item-2' as ItemId]);
    expect(result.get('item-1' as ItemId)).toBe('photos/1.jpg');
    expect(result.get('item-2' as ItemId)).toBe('photos/2.jpg');
  });

  it('returns only the first photo per item', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { item_id: 'item-1', storage_path: 'photos/1a.jpg' },
        { item_id: 'item-1', storage_path: 'photos/1b.jpg' },
      ],
      error: null,
    });

    const result = await fetchThumbnailPaths(['item-1' as ItemId]);
    expect(result.get('item-1' as ItemId)).toBe('photos/1a.jpg');
    expect(result.size).toBe(1);
  });

  it('returns empty map when no item IDs provided', async () => {
    const result = await fetchThumbnailPaths([] as ItemId[]);
    expect(result.size).toBe(0);
  });

  it('returns empty map on error', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'fail' },
    });

    const result = await fetchThumbnailPaths(['item-1' as ItemId]);
    expect(result.size).toBe(0);
  });
});
