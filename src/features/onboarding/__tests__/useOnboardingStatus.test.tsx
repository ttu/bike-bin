import { renderHook } from '@testing-library/react-native';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

const mockFrom = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('useOnboardingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isComplete true when profile and location exist', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { display_name: 'Test User' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'saved_locations') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [{ id: 'loc-1' }], error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useOnboardingStatus(), {
      wrapper: createQueryClientHookWrapper(),
    });

    // Wait for queries to resolve
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.hasProfile).toBe(true);
    expect(result.current.hasLocation).toBe(true);
    expect(result.current.isComplete).toBe(true);
  });

  it('returns isComplete false when profile has no display_name', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { display_name: null }, error: null }),
            }),
          }),
        };
      }
      if (table === 'saved_locations') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [{ id: 'loc-1' }], error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useOnboardingStatus(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.hasProfile).toBe(false);
    expect(result.current.isComplete).toBe(false);
  });

  it('returns isComplete false when no locations exist', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { display_name: 'Test User' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'saved_locations') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useOnboardingStatus(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.hasLocation).toBe(false);
    expect(result.current.isComplete).toBe(false);
  });
});
