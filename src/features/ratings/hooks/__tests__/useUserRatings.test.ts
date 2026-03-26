import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { UserId } from '@/shared/types';

const mockOrder = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

import { useUserRatings } from '../useUserRatings';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

beforeEach(() => jest.clearAllMocks());

describe('useUserRatings', () => {
  it('fetches ratings for a user', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({
          data: [
            {
              id: 'r-1',
              from_user_id: 'u-1',
              to_user_id: 'u-2',
              score: 5,
              text: 'Great!',
              transaction_type: 'borrow',
              created_at: '2026-01-01T00:00:00Z',
              profiles: { display_name: 'Alice', avatar_url: null },
            },
          ],
          error: null,
        }),
      }),
    });

    renderHook(() => useUserRatings('u-2' as UserId), { wrapper: createWrapper() });
    await new Promise((r) => setTimeout(r, 100));

    expect(mockSelect).toHaveBeenCalledWith(
      '*, profiles!ratings_from_user_id_fkey(display_name, avatar_url)',
    );
    expect(mockEq).toHaveBeenCalledWith('to_user_id', 'u-2');
  });

  it('handles error', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({
          data: null,
          error: new Error('DB error'),
        }),
      }),
    });

    const { result } = renderHook(() => useUserRatings('u-2' as UserId), {
      wrapper: createWrapper(),
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(result.current.error).toBeTruthy();
  });
});
