import { renderHook, waitFor, act } from '@testing-library/react-native';
import { mockSelect, mockUpdate, mockEq, mockSingle, mockSupabase } from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

// Import after mocks
import { useNotificationPreferences } from '../useNotificationPreferences';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

// We also need to test parsePreferences — import the module to access it indirectly
// via the hook's behaviour, since parsePreferences is not exported.

beforeEach(() => jest.clearAllMocks());

const mockDefaultPreferences = {
  messages: { push: true, email: true },
  borrowActivity: { push: true, email: true },
  reminders: { push: true, email: false },
};

describe('useNotificationPreferences — parsePreferences (via hook behaviour)', () => {
  it('returns DEFAULT_PREFERENCES when notification_preferences is null', async () => {
    mockSingle.mockResolvedValue({ data: { notification_preferences: null }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences).toEqual(mockDefaultPreferences);
  });

  it('returns DEFAULT_PREFERENCES when notification_preferences is a non-object primitive', async () => {
    mockSingle.mockResolvedValue({ data: { notification_preferences: 'invalid' }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences).toEqual(mockDefaultPreferences);
  });

  it('returns DEFAULT_PREFERENCES when notification_preferences is an empty object', async () => {
    mockSingle.mockResolvedValue({ data: { notification_preferences: {} }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Empty object — all categories fall back to defaults
    expect(result.current.preferences).toEqual(mockDefaultPreferences);
  });

  it('merges partial preferences with defaults', async () => {
    const mockPartial = {
      messages: { push: false, email: true },
      // borrowActivity missing — should fall back to default
    };
    mockSingle.mockResolvedValue({ data: { notification_preferences: mockPartial }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences.messages).toEqual({ push: false, email: true });
    expect(result.current.preferences.borrowActivity).toEqual({ push: true, email: true });
    expect(result.current.preferences.reminders).toEqual({ push: true, email: false });
  });

  it('falls back to defaults for individual boolean fields that are not booleans', async () => {
    const mockInvalidFields = {
      messages: { push: 'yes', email: null },
    };
    mockSingle.mockResolvedValue({
      data: { notification_preferences: mockInvalidFields },
      error: null,
    });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Non-boolean values fall back to defaults (push: true, email: true for messages)
    expect(result.current.preferences.messages).toEqual({ push: true, email: true });
  });

  it('returns fully valid preferences as-is', async () => {
    const mockValid = {
      messages: { push: false, email: false },
      borrowActivity: { push: true, email: false },
      reminders: { push: false, email: true },
    };
    mockSingle.mockResolvedValue({ data: { notification_preferences: mockValid }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences).toEqual(mockValid);
  });
});

describe('useNotificationPreferences — query', () => {
  it('exposes isLoading true while fetching', () => {
    // Return a never-resolving promise to keep isLoading true
    mockSingle.mockReturnValue(new Promise(() => {}));
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('throws when supabase returns an error on query', async () => {
    const mockError = new Error('DB error');
    mockSingle.mockResolvedValue({ data: null, error: mockError });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    // We need the query to error — need a wrapper that won't throw in render
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    // The hook falls back to DEFAULT_PREFERENCES on error (query.data ?? DEFAULT_PREFERENCES)
    // but the query itself should be in error state
    await waitFor(() =>
      expect(queryClient.getQueryState(['notification_preferences', 'user-123'])?.status).toBe(
        'error',
      ),
    );
    // Preferences fall back to defaults even on error
    expect(result.current.preferences).toEqual(mockDefaultPreferences);
  });
});

describe('useNotificationPreferences — mutation (updatePreferences)', () => {
  it('updates preferences via supabase and invalidates query', async () => {
    // Setup query to succeed first
    mockSingle.mockResolvedValue({ data: { notification_preferences: null }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Setup update chain
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newPreferences = {
      messages: { push: false, email: true },
      borrowActivity: { push: true, email: false },
      reminders: { push: false, email: false },
    };

    act(() => {
      result.current.updatePreferences(newPreferences);
    });

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({ notification_preferences: newPreferences }),
    );
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-123');

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notification_preferences'] }),
    );
  });

  it('exposes isUpdating true while mutation is in flight', async () => {
    mockSingle.mockResolvedValue({ data: { notification_preferences: null }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Update never resolves
    const mockUpdateEq = jest.fn().mockReturnValue(new Promise(() => {}));
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updatePreferences(mockDefaultPreferences);
    });

    await waitFor(() => expect(result.current.isUpdating).toBe(true));
  });

  it('propagates mutation errors', async () => {
    mockSingle.mockResolvedValue({ data: { notification_preferences: null }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const mockError = { message: 'Update failed' };
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: mockError });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Wrap in try/catch since the mutation throws
    let caught: unknown;
    await act(async () => {
      try {
        // Use a promise-based call to catch the error
        await new Promise<void>((resolve, _reject) => {
          const mutateWith = result.current.updatePreferences as (
            vars: typeof mockDefaultPreferences,
            opts?: { onError?: (err: unknown) => void; onSuccess?: () => void },
          ) => void;
          mutateWith(mockDefaultPreferences, {
            onError: (err) => {
              caught = err;
              resolve();
            },
            onSuccess: () => resolve(),
          });
        });
      } catch (err) {
        caught = err;
      }
    });

    await waitFor(() => expect(caught).toBeDefined());
  });
});
