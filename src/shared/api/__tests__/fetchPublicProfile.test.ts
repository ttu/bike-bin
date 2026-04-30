import { fetchPublicProfile, fetchPublicProfilesMap } from '../fetchPublicProfile';

const mockMaybeSingle = jest.fn();
const mockRpc = jest.fn((_name: string, _params: { p_user_id?: string; p_user_ids?: string[] }) => {
  if (_name === 'get_public_profiles') {
    return mockBatchResolver();
  }
  return { maybeSingle: mockMaybeSingle };
});

let nextBatchResult: { data: unknown; error: unknown } = { data: [], error: null };
function mockBatchResolver() {
  return Promise.resolve(nextBatchResult);
}

jest.mock('../supabase', () => ({
  supabase: {
    rpc: (name: string, params: { p_user_id?: string; p_user_ids?: string[] }) =>
      mockRpc(name, params),
  },
}));

describe('fetchPublicProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextBatchResult = { data: [], error: null };
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

  it('fetchPublicProfilesMap issues a single batched RPC call', async () => {
    nextBatchResult = {
      data: [
        {
          id: 'a',
          display_name: 'A',
          avatar_url: null,
          rating_avg: 0,
          rating_count: 0,
        },
        {
          id: 'b',
          display_name: 'B',
          avatar_url: null,
          rating_avg: 1,
          rating_count: 2,
        },
      ],
      error: null,
    };

    const map = await fetchPublicProfilesMap(['a', 'b', 'a']);

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('get_public_profiles', {
      p_user_ids: ['a', 'b'],
    });
    expect(map.size).toBe(2);
    expect(map.get('a')?.displayName).toBe('A');
    expect(map.get('b')?.displayName).toBe('B');
  });

  it('fetchPublicProfilesMap returns empty map without RPC for empty input', async () => {
    const map = await fetchPublicProfilesMap([]);
    expect(map.size).toBe(0);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
