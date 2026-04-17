import { QueryClient } from '@tanstack/react-query';

/**
 * Query client for the Storybook **route shell** only (`app/_layout` when
 * Storybook is enabled). Separate from the app singleton so the shell never
 * reads the main app cache. Story previews use `createStorybookQueryClient`
 * inside `StoryProviders`.
 */
export const storybookShellQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
