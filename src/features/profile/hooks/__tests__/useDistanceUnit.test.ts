import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockResolvedValue({ error: null }),
      }),
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

jest.mock('../useProfile', () => ({
  useProfile: () => ({ data: { distanceUnit: 'mi' } }),
}));

import { useDistanceUnit } from '../useDistanceUnit';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('useDistanceUnit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns distance unit from profile', () => {
    const { result } = renderHook(() => useDistanceUnit(), { wrapper: createWrapper() });
    expect(result.current.distanceUnit).toBe('mi');
  });

  it('provides setDistanceUnit function', () => {
    const { result } = renderHook(() => useDistanceUnit(), { wrapper: createWrapper() });
    expect(typeof result.current.setDistanceUnit).toBe('function');
  });

  it('calls supabase update when setDistanceUnit is called', async () => {
    const { result } = renderHook(() => useDistanceUnit(), { wrapper: createWrapper() });

    act(() => {
      result.current.setDistanceUnit('km');
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(mockUpdate).toHaveBeenCalledWith({ distance_unit: 'km' });
  });
});
