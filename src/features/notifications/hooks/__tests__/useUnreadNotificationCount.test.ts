import { renderHook } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';

const mockEq2 = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: (...args: unknown[]) => mockSelect(...args),
    })),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

import { useUnreadNotificationCount } from '../useUnreadNotificationCount';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useUnreadNotificationCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches the unread notification count for the current user', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ count: 5, error: null }),
      }),
    });

    renderHook(() => useUnreadNotificationCount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(mockEq2).toHaveBeenCalledWith('is_read', false);
  });
});
