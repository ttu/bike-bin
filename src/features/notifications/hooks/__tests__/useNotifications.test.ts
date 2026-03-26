import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

// Import after mocks
import { useNotifications } from '../useNotifications';

beforeEach(() => jest.clearAllMocks());

describe('useNotifications', () => {
  it('returns an empty array when user has no notifications', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('maps notification rows to domain Notification objects', async () => {
    const mockRows = [
      {
        id: 'notif-1',
        user_id: 'user-123',
        type: 'message',
        title: 'New message',
        body: 'You have a new message',
        data: { conversationId: 'conv-1' },
        is_read: false,
        created_at: '2026-01-01T10:00:00Z',
      },
      {
        id: 'notif-2',
        user_id: 'user-123',
        type: 'borrow_request',
        title: 'Borrow request',
        body: undefined,
        data: {},
        is_read: true,
        created_at: '2026-01-01T09:00:00Z',
      },
    ];

    mockOrder.mockResolvedValue({ data: mockRows, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);

    const first = result.current.data![0];
    expect(first.id).toBe('notif-1');
    expect(first.userId).toBe('user-123');
    expect(first.type).toBe('message');
    expect(first.title).toBe('New message');
    expect(first.body).toBe('You have a new message');
    expect(first.data).toEqual({ conversationId: 'conv-1' });
    expect(first.isRead).toBe(false);
    expect(first.createdAt).toBe('2026-01-01T10:00:00Z');

    const second = result.current.data![1];
    expect(second.id).toBe('notif-2');
    expect(second.isRead).toBe(true);
  });

  it('queries notifications filtered by current user id', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    renderHook(() => useNotifications(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123'));
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('throws when supabase returns an error', async () => {
    const mockError = new Error('Forbidden');

    mockOrder.mockResolvedValue({ data: null, error: mockError });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(mockError);
  });
});
