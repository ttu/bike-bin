import { renderHook, waitFor } from '@testing-library/react-native';
import { mockSelect, mockEq, mockSingle, mockSupabase } from '@/test/supabaseMocks';
import type { GroupId } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));

// Import after mocks
import { useGroup } from '../useGroup';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single group by ID', async () => {
    const groupId = 'g-1' as GroupId;
    const row = {
      id: groupId,
      name: 'Road Cyclists',
      description: 'A cycling group',
      is_public: true,
      rating_avg: 3.47,
      rating_count: 78,
      created_at: '2025-07-13T04:08:50.303Z',
    };

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: row, error: null }),
      }),
    });

    const { result } = renderHook(() => useGroup(groupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: groupId,
        name: 'Road Cyclists',
        description: 'A cycling group',
        isPublic: true,
        ratingAvg: 3.47,
        ratingCount: 78,
        createdAt: '2025-07-13T04:08:50.303Z',
      });
    });

    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', groupId);
  });

  it('throws when supabase returns an error', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: null, error: new Error('Not found') }),
      }),
    });

    const { result } = renderHook(() => useGroup('missing-id' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useGroup('' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
