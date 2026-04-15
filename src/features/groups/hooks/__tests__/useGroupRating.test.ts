import { renderHook, waitFor } from '@testing-library/react-native';
import { mockSelect, mockEq, mockSingle } from '@/test/supabaseMocks';
import type { GroupId } from '@/shared/types';
import { useGroupRating } from '../useGroupRating';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

const GROUP_ID = 'group-1' as GroupId;

describe('useGroupRating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches rating aggregate for given group', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({
          data: { rating_avg: 4.25, rating_count: 8 },
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useGroupRating(GROUP_ID), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ ratingAvg: 4.25, ratingCount: 8 });
    expect(mockSelect).toHaveBeenCalledWith('rating_avg, rating_count');
    expect(mockEq).toHaveBeenCalledWith('id', GROUP_ID);
  });

  it('does not fetch when groupId is undefined', () => {
    const { result } = renderHook(() => useGroupRating(undefined), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
