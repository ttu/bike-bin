import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockEq2 = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSubscribe = jest.fn().mockReturnValue({});
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = jest.fn().mockReturnValue({ on: mockOn });
const mockRemoveChannel = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: (...args: unknown[]) => mockSelect(...args),
    })),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

import { useUnreadNotificationCount } from '../useUnreadNotificationCount';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('useUnreadNotificationCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches unread count and subscribes to realtime', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ count: 5, error: null }),
      }),
    });

    renderHook(() => useUnreadNotificationCount(), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(mockChannel).toHaveBeenCalledWith('unread-notifications');
    expect(mockSubscribe).toHaveBeenCalled();
  });
});
