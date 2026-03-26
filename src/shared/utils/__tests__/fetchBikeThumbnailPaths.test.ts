const mockSelect = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Import after mocks
import { fetchBikeThumbnailPaths } from '../fetchBikeThumbnailPaths';

describe('fetchBikeThumbnailPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty map when given an empty array', async () => {
    const result = await fetchBikeThumbnailPaths([]);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
    // Should not call supabase at all
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns a map of bikeId to storage_path', async () => {
    const rows = [
      { bike_id: 'bike-1', storage_path: 'bikes/bike-1/thumb.jpg' },
      { bike_id: 'bike-2', storage_path: 'bikes/bike-2/thumb.jpg' },
    ];

    mockSelect.mockReturnValue({
      in: mockIn.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: rows, error: null }),
      }),
    });

    const result = await fetchBikeThumbnailPaths(['bike-1', 'bike-2']);

    expect(result.get('bike-1')).toBe('bikes/bike-1/thumb.jpg');
    expect(result.get('bike-2')).toBe('bikes/bike-2/thumb.jpg');
    expect(result.size).toBe(2);
  });

  it('only keeps the first photo per bike (by sort_order)', async () => {
    const rows = [
      { bike_id: 'bike-1', storage_path: 'bikes/bike-1/first.jpg' },
      { bike_id: 'bike-1', storage_path: 'bikes/bike-1/second.jpg' },
    ];

    mockSelect.mockReturnValue({
      in: mockIn.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: rows, error: null }),
      }),
    });

    const result = await fetchBikeThumbnailPaths(['bike-1']);

    expect(result.get('bike-1')).toBe('bikes/bike-1/first.jpg');
    expect(result.size).toBe(1);
  });

  it('handles null data gracefully', async () => {
    mockSelect.mockReturnValue({
      in: mockIn.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: null, error: null }),
      }),
    });

    const result = await fetchBikeThumbnailPaths(['bike-1']);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('queries the bike_photos table with the provided bike IDs', async () => {
    mockSelect.mockReturnValue({
      in: mockIn.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: [], error: null }),
      }),
    });

    await fetchBikeThumbnailPaths(['bike-a', 'bike-b', 'bike-c']);

    expect(mockSelect).toHaveBeenCalledWith('bike_id, storage_path');
    expect(mockIn).toHaveBeenCalledWith('bike_id', ['bike-a', 'bike-b', 'bike-c']);
    expect(mockOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
  });
});
