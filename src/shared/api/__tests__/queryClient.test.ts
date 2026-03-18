import { queryClient } from '../queryClient';

describe('queryClient', () => {
  it('has staleTime of 5 minutes', () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('retries failed queries 2 times', () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.retry).toBe(2);
  });

  it('does not refetch on window focus', () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
  });
});
