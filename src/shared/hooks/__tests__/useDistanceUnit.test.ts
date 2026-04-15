import { renderHook, act } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';

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

jest.mock('@/features/auth', () => mockAuthModule);

jest.mock('@/features/profile', () => ({
  useProfile: () => ({ data: { distanceUnit: 'mi' } }),
}));

import { useDistanceUnit } from '../useDistanceUnit';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useDistanceUnit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns distance unit from profile', () => {
    const { result } = renderHook(() => useDistanceUnit(), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.distanceUnit).toBe('mi');
  });

  it('provides setDistanceUnit function', () => {
    const { result } = renderHook(() => useDistanceUnit(), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(typeof result.current.setDistanceUnit).toBe('function');
  });

  it('calls supabase update when setDistanceUnit is called', async () => {
    const { result } = renderHook(() => useDistanceUnit(), {
      wrapper: createQueryClientHookWrapper(),
    });

    act(() => {
      result.current.setDistanceUnit('km');
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(mockUpdate).toHaveBeenCalledWith({ distance_unit: 'km' });
  });
});
