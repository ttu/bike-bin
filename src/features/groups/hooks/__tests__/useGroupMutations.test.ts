import { renderHook, waitFor } from '@testing-library/react-native';
import {
  mockInsert,
  mockDelete,
  mockEq,
  mockSelect,
  mockSingle,
  mockSupabase,
} from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';
import { useCreateGroup } from '../useCreateGroup';
import { useInviteMember } from '../useInviteMember';
import { useJoinGroup, useLeaveGroup } from '../useJoinGroup';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

beforeEach(() => jest.clearAllMocks());

describe('useCreateGroup', () => {
  it('creates a group and adds creator as admin', async () => {
    const groupData = { id: 'group-1', name: 'MTB Club' };
    mockSingle.mockResolvedValue({ data: groupData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    // First call: insert group -> select -> single
    // Second call: insert member -> resolve
    mockInsert.mockReturnValueOnce({ select: mockSelect }).mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ name: 'MTB Club', isPublic: true } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('propagates group insert errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ name: 'MTB Club', isPublic: true } as never);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useInviteMember', () => {
  it('invites a user to a group', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useInviteMember(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ groupId: 'group-1' as never, userId: 'user-456' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useJoinGroup', () => {
  it('joins a group', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useJoinGroup(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate('group-1' as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useLeaveGroup', () => {
  it('leaves a group', async () => {
    mockEq.mockResolvedValue({ error: null });
    const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq2 });

    const { result } = renderHook(() => useLeaveGroup(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate('group-1' as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
