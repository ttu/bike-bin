import { renderHook } from '@testing-library/react-native';
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


// Import after mocks
import { useGroup } from '../useGroup';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

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

    const { result } = renderHook(() => useGroup(group.id), { wrapper: createQueryClientHookWrapper() });

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
      wrapper: createQueryClientHookWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.error).toBeTruthy();
  });

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useGroup('' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
