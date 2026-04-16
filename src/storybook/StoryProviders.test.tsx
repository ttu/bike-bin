import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { StoryProviders } from './StoryProviders';

describe('StoryProviders', () => {
  it('renders children inside the provider tree', () => {
    const { getByText } = render(
      <StoryProviders>
        <Text>storybook-providers</Text>
      </StoryProviders>,
    );
    expect(getByText('storybook-providers')).toBeTruthy();
  });
});
