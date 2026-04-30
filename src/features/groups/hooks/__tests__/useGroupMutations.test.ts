import { renderHook, waitFor } from '@testing-library/react-native';
import { mockInsert, mockDelete, mockEq, mockSupabase } from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';
import { useCreateInvitation } from '../useGroupInvitations';
import { useJoinGroup, useLeaveGroup } from '../useJoinGroup';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

beforeEach(() => jest.clearAllMocks());

describe('useCreateInvitation', () => {
  it('creates a pending invitation', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useCreateInvitation(), {
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
