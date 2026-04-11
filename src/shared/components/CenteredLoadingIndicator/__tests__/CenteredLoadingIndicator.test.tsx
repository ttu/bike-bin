import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { CenteredLoadingIndicator } from '../CenteredLoadingIndicator';

describe('CenteredLoadingIndicator', () => {
  it('renders an accessible loading label', () => {
    renderWithProviders(<CenteredLoadingIndicator />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });
});
