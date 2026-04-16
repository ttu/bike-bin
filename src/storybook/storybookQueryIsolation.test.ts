import { queryClient } from '@/shared/api/queryClient';
import { createStorybookQueryClient } from './createStorybookQueryClient';
import { storybookShellQueryClient } from './shellQueryClient';

describe('Storybook query isolation', () => {
  it('shell client is not the app singleton', () => {
    expect(storybookShellQueryClient).not.toBe(queryClient);
  });

  it('createStorybookQueryClient returns a new instance each time', () => {
    const a = createStorybookQueryClient();
    const b = createStorybookQueryClient();
    expect(a).not.toBe(b);
  });
});
