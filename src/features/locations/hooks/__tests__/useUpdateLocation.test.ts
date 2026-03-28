import { renderHook, waitFor } from '@testing-library/react-native';
import { useUpdateLocation } from '../useUpdateLocation';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

// Matches: .update(x).eq('id', y).select().single()
function mockBuildUpdateChain(resolvedData: Record<string, unknown>) {
  return {
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: resolvedData, error: null }),
        }),
      }),
    }),
  };
}

// Matches: .update({ is_primary: false }).eq('user_id', x).eq('is_primary', true)
function mockBuildDemoteChain() {
  return {
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
}

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

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

jest.mock('../../utils/geocoding', () => ({
  geocodePostcode: jest.fn().mockResolvedValue({
    areaName: 'Test Area',
    lat: 51.5,
    lng: -0.1,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCallCount = 0;
  mockFromChains = [];
});

describe('useUpdateLocation', () => {
  it('updates label only', async () => {
    const locData = { id: 'loc-1', label: 'Home' };
    mockFromChains = [mockBuildUpdateChain(locData)];

    const { result } = renderHook(() => useUpdateLocation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ id: 'loc-1' as never, label: 'Home' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('re-geocodes when postcode changes', async () => {
    const locData = { id: 'loc-1', postcode: 'SW1A 1AA' };
    mockFromChains = [mockBuildUpdateChain(locData)];

    const { result } = renderHook(() => useUpdateLocation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ id: 'loc-1' as never, postcode: 'SW1A 1AA', country: 'GB' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // geocodePostcode is mocked at top level - verify the mock was called
    const geocoding = jest.requireMock('../../utils/geocoding');
    expect(geocoding.geocodePostcode).toHaveBeenCalledWith('SW1A 1AA', 'GB');
  });

  it('handles primary toggle', async () => {
    const locData = { id: 'loc-1', is_primary: true };
    // First from(): demote existing primaries (.update().eq().eq())
    // Second from(): actual update (.update().eq().select().single())
    mockFromChains = [mockBuildDemoteChain(), mockBuildUpdateChain(locData)];

    const { result } = renderHook(() => useUpdateLocation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ id: 'loc-1' as never, isPrimary: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
