import { renderHook, act } from '@testing-library/react-native';
import { mockInsert, mockSupabase } from '@/test/supabaseMocks';
import type { UserId } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));

// Import after mocks
import { useReport } from '../useReport';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a report with all required fields', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createQueryClientHookWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'user',
        targetId: 'user-456',
        reason: 'spam',
        text: 'This user is sending spam messages',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'user-123',
      target_type: 'user',
      target_id: 'user-456',
      reason: 'spam',
      text: 'This user is sending spam messages',
      status: 'open',
    });
  });

  it('sets text to null when not provided', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createQueryClientHookWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'item',
        targetId: 'item-789',
        reason: 'prohibited_item',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ text: null }));
  });

  it('throws on supabase error', async () => {
    mockInsert.mockResolvedValue({ error: new Error('RLS violation') });

    const { result } = renderHook(() => useReport(), { wrapper: createQueryClientHookWrapper() });

    await expect(
      result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'user',
        targetId: 'user-456',
        reason: 'harassment',
      }),
    ).rejects.toThrow('RLS violation');
  });

  it('inserts report with target_type item_photo', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createQueryClientHookWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'item_photo',
        targetId: 'photo-abc',
        reason: 'inappropriate',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ target_type: 'item_photo', target_id: 'photo-abc' }),
    );
  });

  it('inserts report with target_type message', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createQueryClientHookWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'message',
        targetId: 'msg-xyz',
        reason: 'harassment',
        text: 'Threatening message',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        target_type: 'message',
        target_id: 'msg-xyz',
        text: 'Threatening message',
      }),
    );
  });

  it('always sets status to "open"', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useReport(), { wrapper: createQueryClientHookWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        reporterId: 'user-123' as UserId,
        targetType: 'item',
        targetId: 'item-1',
        reason: 'counterfeit',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }));
  });
});
