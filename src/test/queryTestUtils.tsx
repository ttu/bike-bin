import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient(
  options?: ConstructorParameters<typeof QueryClient>[0],
): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    ...options,
  });
}

export type QueryClientHookWrapper = React.ComponentType<{ children: React.ReactNode }>;

/**
 * Wrapper for `renderHook` with an isolated QueryClient (new client per call).
 */
export function createQueryClientHookWrapper(): QueryClientHookWrapper {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

/**
 * Wrapper for `renderHook` using a provided QueryClient (e.g. to spy on invalidateQueries).
 */
export function createQueryClientHookWrapperWithClient(
  queryClient: QueryClient,
): QueryClientHookWrapper {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}
