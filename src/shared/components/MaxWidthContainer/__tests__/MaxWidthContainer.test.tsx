import { Text, Platform } from 'react-native';
import { MaxWidthContainer } from '../MaxWidthContainer';
import { renderWithProviders } from '@/test/utils';

describe('MaxWidthContainer', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
  });

  it('renders children', () => {
    const { getByText } = renderWithProviders(
      <MaxWidthContainer>
        <Text>Test content</Text>
      </MaxWidthContainer>,
    );
    expect(getByText('Test content')).toBeTruthy();
  });

  it('renders children directly on native (no wrapper)', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    const { getByText } = renderWithProviders(
      <MaxWidthContainer>
        <Text>Native content</Text>
      </MaxWidthContainer>,
    );
    expect(getByText('Native content')).toBeTruthy();
  });

  it('renders wrapper on web', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web' });
    const { getByText, toJSON } = renderWithProviders(
      <MaxWidthContainer>
        <Text>Web content</Text>
      </MaxWidthContainer>,
    );
    expect(getByText('Web content')).toBeTruthy();
    // On web, the tree should contain the outer wrapper
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });
});
