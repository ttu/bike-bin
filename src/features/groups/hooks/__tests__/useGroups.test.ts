import { renderHook } from '@testing-library/react-native';
import { createMockGroup } from '@/test/factories';
import { GroupRole } from '@/shared/types';
import type { GroupId } from '@/shared/types';

// Mock supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));


// Import after mocks
import { useGroups, useCreateGroup, useDeleteGroup } from '../useGroups';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches groups for the current user', async () => {
    const group = createMockGroup({ isPublic: false });
    const mockData = [
      {
        group_id: group.id,
        role: GroupRole.Admin,
        joined_at: '2026-01-01T00:00:00Z',
        groups: group,
      },
    ];

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: mockData, error: null }),
      }),
    });

    renderHook(() => useGroups(), { wrapper: createQueryClientHookWrapper() });

    // Wait for query to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The hook should have been called
    expect(mockSelect).toHaveBeenCalled();
  });
});

describe('useCreateGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a group and adds creator as admin', async () => {
    const newGroup = createMockGroup({ name: 'Test Group', isPublic: true });

    // First call: insert group
    mockInsert.mockReturnValueOnce({
      select: mockSelect.mockReturnValueOnce({
        single: mockSingle.mockResolvedValueOnce({ data: newGroup, error: null }),
      }),
    });

    // Second call: insert group_member
    mockInsert.mockReturnValueOnce(Promise.resolve({ error: null }));

    const { result } = renderHook(() => useCreateGroup(), { wrapper: createQueryClientHookWrapper() });

    await result.current.mutateAsync({
      name: 'Test Group',
      description: 'A test group',
      isPublic: true,
    });

    // Verify insert was called (first for group, then for member)
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('throws on supabase error', async () => {
    mockInsert.mockReturnValueOnce({
      select: mockSelect.mockReturnValueOnce({
        single: mockSingle.mockResolvedValueOnce({
          data: null,
          error: new Error('RLS violation'),
        }),
      }),
    });

    const { result } = renderHook(() => useCreateGroup(), { wrapper: createQueryClientHookWrapper() });

    await expect(
      result.current.mutateAsync({
        name: 'Test Group',
        isPublic: true,
      }),
    ).rejects.toThrow('RLS violation');
  });
});

describe('useDeleteGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a group by ID', async () => {
    mockDelete.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useDeleteGroup(), { wrapper: createQueryClientHookWrapper() });

    await result.current.mutateAsync('group-1' as GroupId);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'group-1');
  });

  it('throws on supabase error', async () => {
    mockDelete.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: new Error('Not authorized') }),
    });

    const { result } = renderHook(() => useDeleteGroup(), { wrapper: createQueryClientHookWrapper() });

    await expect(result.current.mutateAsync('group-1' as GroupId)).rejects.toThrow(
      'Not authorized',
    );
  });
});
