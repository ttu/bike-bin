import { fetchPublicProfile, fetchPublicProfilesMap } from '../fetchPublicProfile';

const mockMaybeSingle = jest.fn();
const mockRpc = jest.fn((_name: string, _params: { p_user_id: string }) => ({
  maybeSingle: mockMaybeSingle,
}));

jest.mock('../supabase', () => ({
  supabase: {
    rpc: (name: string, params: { p_user_id: string }) => mockRpc(name, params),
  },
}));

describe('fetchPublicProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps RPC row to FetchedPublicProfile', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        display_name: 'Dev User',
        avatar_url: 'https://x.test/a.png',
        rating_avg: 4.5,
        rating_count: 3,
      },
      error: null,
    });

    const result = await fetchPublicProfile('user-1');

    expect(mockRpc).toHaveBeenCalledWith('get_public_profile', { p_user_id: 'user-1' });
    expect(result).toEqual({
      id: 'user-1',
      displayName: 'Dev User',
      avatarUrl: 'https://x.test/a.png',
      ratingAvg: 4.5,
      ratingCount: 3,
    });
  });

  it('returns undefined when no row', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(fetchPublicProfile('missing')).resolves.toBeUndefined();
  });

  it('fetchPublicProfilesMap aggregates parallel lookups', async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: {
          id: 'a',
          display_name: 'A',
          avatar_url: null,
          rating_avg: 0,
          rating_count: 0,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: 'b',
          display_name: 'B',
          avatar_url: null,
          rating_avg: 1,
          rating_count: 2,
        },
        error: null,
      });

    const map = await fetchPublicProfilesMap(['a', 'b']);

    expect(map.size).toBe(2);
    expect(map.get('a')?.displayName).toBe('A');
    expect(map.get('b')?.displayName).toBe('B');
  });
});
