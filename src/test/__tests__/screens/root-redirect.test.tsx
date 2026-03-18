import React from 'react';
import { renderWithProviders } from '@/test/utils';
import Index from '../../../../app/index';

const mockRedirect = jest.fn();

jest.mock('expo-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
}));

describe('Root index route', () => {
  it('redirects to inventory tab', () => {
    renderWithProviders(<Index />);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/(tabs)/inventory' }),
    );
  });
});
