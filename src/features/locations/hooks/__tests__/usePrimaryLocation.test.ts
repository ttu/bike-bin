import { renderHook } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';

let mockCallCount = 0;
let mockFromChains: Record<string, unknown>[] = [];

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const chain = mockFromChains[mockCallCount] ?? mockFromChains[0];
      mockCallCount++;
      return chain;
    }),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

jest.mock('../../utils/mapLocationRow', () => ({
  mapLocationRow: jest.fn((row: Record<string, unknown>) => ({
    id: row.id,
    label: row.label,
  })),
}));

import { usePrimaryLocation } from '../usePrimaryLocation';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

beforeEach(() => {
  jest.clearAllMocks();
  mockCallCount = 0;
  mockFromChains = [];
});

describe('usePrimaryLocation', () => {
  it('fetches primary location', async () => {
    mockFromChains = [
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'loc-1', label: 'Home' },
                error: null,
              }),
            }),
          }),
        }),
      },
    ];

    renderHook(() => usePrimaryLocation(), { wrapper: createQueryClientHookWrapper() });
    await new Promise((r) => setTimeout(r, 100));

    expect(mockCallCount).toBeGreaterThan(0);
  });

  it('falls back to first location when no primary exists', async () => {
    mockFromChains = [
      // First call: primary query fails with PGRST116
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'no rows' },
              }),
            }),
          }),
        }),
      },
      // Second call: fallback query
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'loc-2', label: 'Work' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      },
    ];

    renderHook(() => usePrimaryLocation(), { wrapper: createQueryClientHookWrapper() });
    await new Promise((r) => setTimeout(r, 100));

    expect(mockCallCount).toBe(2);
  });
});
