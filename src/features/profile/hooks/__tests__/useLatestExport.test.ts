import { renderHook, waitFor } from '@testing-library/react-native';
import { useLatestExport } from '../useLatestExport';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockMaybeSingle = jest.fn();
const mockLimit = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = jest.fn(() => ({ limit: mockLimit }));
const mockEq = jest.fn(() => ({ order: mockOrder }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({ select: mockSelect })),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('useLatestExport', () => {
  it('returns the latest export request for the user', async () => {
    const mockExport = {
      id: 'export-1',
      user_id: 'user-1',
      status: 'completed',
      storage_path: 'exports/user-1/export-1.zip',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockMaybeSingle.mockResolvedValue({ data: mockExport, error: null });

    const { result } = renderHook(() => useLatestExport('user-1'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('completed');
  });

  it('returns null when no export requests exist', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useLatestExport('user-1'), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
