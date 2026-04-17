import { QueryClient } from '@tanstack/react-query';

/**
 * One isolated TanStack Query client per story canvas.
 * Do not use the app `queryClient` from `@/shared/api/queryClient` in Storybook —
 * cache and server state must come only from the story module (args, local
 * constants, or `setQueryData` in that file’s decorator).
 */
export function createStorybookQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}
