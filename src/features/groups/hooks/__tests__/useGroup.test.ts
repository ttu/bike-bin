import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createMockGroup } from '@/test/factories';
import type { GroupId } from '@/shared/types';

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
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
import { useGroup } from '../useGroup';

describe('useGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single group by ID', async () => {
    const group = createMockGroup({ name: 'Road Cyclists', isPublic: true });

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: group, error: null }),
      }),
    });

    const { result } = renderHook(() => useGroup(group.id), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', group.id);
    expect(result.current.data).toEqual(group);
  });

  it('throws when supabase returns an error', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: null, error: new Error('Not found') }),
      }),
    });

    const { result } = renderHook(() => useGroup('missing-id' as GroupId), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.error).toBeTruthy();
  });

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useGroup('' as GroupId), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
