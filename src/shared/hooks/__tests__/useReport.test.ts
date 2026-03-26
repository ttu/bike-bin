import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { UserId } from '@/shared/types';

const mockInsert = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

// Import after mocks
import { useReport } from '../useReport';

describe('useReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a report with all required fields', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'user',
        targetId: 'user-456',
        reason: 'spam',
        text: 'This user is sending spam messages',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'user-123',
      target_type: 'user',
      target_id: 'user-456',
      reason: 'spam',
      text: 'This user is sending spam messages',
      status: 'open',
    });
  });

  it('sets text to null when not provided', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'item',
        targetId: 'item-789',
        reason: 'prohibited_item',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ text: null }));
  });

  it('throws on supabase error', async () => {
    mockInsert.mockResolvedValue({ error: new Error('RLS violation') });

    const { result } = renderHook(() => useReport(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'user',
        targetId: 'user-456',
        reason: 'harassment',
      }),
    ).rejects.toThrow('RLS violation');
  });

  it('always sets status to "open"', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'item',
        targetId: 'item-1',
        reason: 'counterfeit',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }));
  });
});
