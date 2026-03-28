import { renderHook, waitFor } from '@testing-library/react-native';
import { useDeleteAccount } from '../useDeleteAccount';
import { useSubmitSupport } from '../useSubmitSupport';
import { useUpdateProfile } from '../useUpdateProfile';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockGetSession = jest.fn();
const mockInvoke = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
    })),
    auth: {
      getSession: () => mockGetSession(),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

beforeEach(() => jest.clearAllMocks());

describe('useDeleteAccount', () => {
  it('calls delete-account edge function with session token', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  it('throws when not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not authenticated');
  });
});

describe('useSubmitSupport', () => {
  it('inserts a support request', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSubmitSupport(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({
      subject: 'Bug report',
      body: 'Something broke',
      email: 'test@example.com',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('propagates errors', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'fail' } });

    const { result } = renderHook(() => useSubmitSupport(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ subject: 'Bug', body: 'Broken' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateProfile', () => {
  it('updates profile with displayName', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useUpdateProfile('user-123' as never), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ displayName: 'NewName' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('updates profile with avatarUrl', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useUpdateProfile('user-123' as never), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ avatarUrl: 'https://example.com/new.jpg' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
