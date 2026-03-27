import { renderHook } from '@testing-library/react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '../queryTestUtils';

describe('queryTestUtils', () => {
  it('createQueryClientHookWrapper provides an isolated QueryClient', () => {
    const { result } = renderHook(() => useQueryClient(), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.getDefaultOptions().queries?.retry).toBe(false);
    expect(result.current.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it('createQueryClientHookWrapperWithClient uses the given client', () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useQueryClient(), {
      wrapper: createQueryClientHookWrapperWithClient(client),
    });
    expect(result.current).toBe(client);
  });
});
