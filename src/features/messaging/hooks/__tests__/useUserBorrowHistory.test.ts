import { renderHook, waitFor } from '@testing-library/react-native';
import type { UserId } from '@/shared/types';
import { useUserBorrowHistory } from '../useUserBorrowHistory';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useUserBorrowHistory', () => {
  it('returns 0/0 stub when a userId is provided', async () => {
    const { result } = renderHook(() => useUserBorrowHistory('user-1' as UserId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ borrowCount: 0, completedOnTimeCount: 0 });
  });

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useUserBorrowHistory(undefined), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
