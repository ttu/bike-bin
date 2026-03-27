import { renderHook, waitFor } from '@testing-library/react-native';
import type { ConversationId } from '@/shared/types';

const mockFetchPublicProfile = jest.fn();

jest.mock('@/shared/api/fetchPublicProfile', () => ({
  fetchPublicProfile: (...args: unknown[]) => mockFetchPublicProfile(...args),
}));

// Counter-based mock for multiple sequential supabase.from() calls
let mockCallCount = 0;
let mockFromChains: Record<string, unknown>[] = [];

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const chain = mockFromChains[mockCallCount] ?? mockFromChains[mockFromChains.length - 1];
      mockCallCount++;
      return chain;
    }),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

// Import after mocks
import { useConversation } from '../useConversation';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

beforeEach(() => {
  jest.clearAllMocks();
  mockCallCount = 0;
  mockFromChains = [];
  mockFetchPublicProfile.mockResolvedValue(undefined);
});

describe('useConversation', () => {
  it('returns undefined when conversationId is undefined', async () => {
    const { result } = renderHook(() => useConversation(undefined), {
      wrapper: createQueryClientHookWrapper(),
    });

    // enabled: !!userId && !!conversationId — disabled when no conversationId
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches and assembles a single conversation with all fields', async () => {
    const mockConv = {
      id: 'conv-1',
      item_id: 'item-1',
      created_at: '2026-01-01T10:00:00Z',
      items: {
        id: 'item-1',
        owner_id: 'owner-1',
        name: 'SRAM Cranks',
        status: 'available',
        availability_types: ['lend', 'give'],
      },
    };
    const mockParticipants = [{ user_id: 'user-456' }];
    const mockPhotos = [{ storage_path: 'items/item-1/photo.jpg' }];

    mockFetchPublicProfile.mockResolvedValue({
      id: 'user-456',
      displayName: 'Bob',
      avatarUrl: 'https://example.com/bob.jpg',
      ratingAvg: 0,
      ratingCount: 0,
    });

    // Call 1: conversations .select().eq().single()
    mockFromChains[0] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockConv, error: null }),
        }),
      }),
    };

    // Call 2: conversation_participants .select().eq().neq()
    mockFromChains[1] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({ data: mockParticipants, error: null }),
        }),
      }),
    };

    // Call 3: item_photos .select().eq().order().limit()
    mockFromChains[2] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockPhotos, error: null }),
          }),
        }),
      }),
    };

    const { result } = renderHook(() => useConversation('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const conv = result.current.data;
    expect(conv).toBeDefined();
    expect(conv!.id).toBe('conv-1');
    expect(conv!.itemId).toBe('item-1');
    expect(conv!.itemOwnerId).toBe('owner-1');
    expect(conv!.itemName).toBe('SRAM Cranks');
    expect(conv!.itemStatus).toBe('available');
    expect(conv!.itemAvailabilityTypes).toEqual(['lend', 'give']);
    expect(conv!.itemPhotoPath).toBe('items/item-1/photo.jpg');
    expect(conv!.otherParticipantId).toBe('user-456');
    expect(conv!.otherParticipantName).toBe('Bob');
    expect(conv!.otherParticipantAvatarUrl).toBe('https://example.com/bob.jpg');
    expect(conv!.lastMessageBody).toBeUndefined();
    expect(conv!.lastMessageAt).toBeUndefined();
    expect(conv!.unreadCount).toBe(0);
    expect(conv!.createdAt).toBe('2026-01-01T10:00:00Z');
  });

  it('handles conversation with no other participant', async () => {
    const mockConv = {
      id: 'conv-1',
      item_id: null,
      created_at: '2026-01-01T10:00:00Z',
      items: null,
    };

    // Call 1: conversations
    mockFromChains[0] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockConv, error: null }),
        }),
      }),
    };

    // Call 2: conversation_participants — no other participant
    mockFromChains[1] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    };

    const { result } = renderHook(() => useConversation('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const conv = result.current.data;
    expect(conv).toBeDefined();
    expect(conv!.otherParticipantId).toBe('');
    expect(conv!.otherParticipantName).toBeUndefined();
    expect(conv!.otherParticipantAvatarUrl).toBeUndefined();
    expect(conv!.itemPhotoPath).toBeUndefined();
    expect(conv!.itemName).toBeUndefined();
  });

  it('handles items as an array (Supabase join format)', async () => {
    const mockConv = {
      id: 'conv-1',
      item_id: 'item-2',
      created_at: '2026-01-01T10:00:00Z',
      // Supabase returns joins as array
      items: [
        {
          id: 'item-2',
          owner_id: 'owner-2',
          name: 'Bike Pump',
          status: 'loaned',
          availability_types: ['lend'],
        },
      ],
    };

    // Call 1: conversations
    mockFromChains[0] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockConv, error: null }),
        }),
      }),
    };

    // Call 2: conversation_participants
    mockFromChains[1] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    };

    // Call 3: item_photos
    mockFromChains[2] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    };

    const { result } = renderHook(() => useConversation('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.itemName).toBe('Bike Pump');
    expect(result.current.data!.itemOwnerId).toBe('owner-2');
    expect(result.current.data!.itemStatus).toBe('loaned');
  });

  it('throws when supabase returns an error', async () => {
    const mockError = new Error('Not found');

    mockFromChains[0] = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      }),
    };

    const { result } = renderHook(() => useConversation('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(mockError);
  });
});
