import { renderHook, waitFor } from '@testing-library/react-native';
import { useAcceptedBorrowRequestForItem } from '../useAcceptedBorrowRequestForItem';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';
import type { ItemId } from '@/shared/types';

const mockMaybeSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
    })),
  },
}));

describe('useAcceptedBorrowRequestForItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns undefined when no accepted request exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(
      () =>
        useAcceptedBorrowRequestForItem('item-1' as ItemId, {
          enabled: true,
        }),
      { wrapper: createQueryClientHookWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('returns borrow request id when an accepted row exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'req-abc' }, error: null });

    const { result } = renderHook(
      () =>
        useAcceptedBorrowRequestForItem('item-1' as ItemId, {
          enabled: true,
        }),
      { wrapper: createQueryClientHookWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('req-abc');
  });

  it('does not fetch when disabled', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'req-abc' }, error: null });

    const { result } = renderHook(
      () =>
        useAcceptedBorrowRequestForItem('item-1' as ItemId, {
          enabled: false,
        }),
      { wrapper: createQueryClientHookWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });
});
