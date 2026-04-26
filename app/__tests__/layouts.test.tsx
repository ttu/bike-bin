import React from 'react';
import { render } from '@testing-library/react-native';
import AuthLayout from '../(auth)/_layout';
import OnboardingLayout from '../(onboarding)/_layout';
import SearchLayout from '../(tabs)/search/_layout';
import MessagesLayout from '../(tabs)/messages/_layout';
import BikesTabLayout from '../(tabs)/bikes/_layout';
import InventoryLayout from '../(tabs)/inventory/_layout';
import ProfileLayout from '../(tabs)/profile/_layout';

function MockStackScreen() {
  return null;
}
MockStackScreen.displayName = 'StackScreen';

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  function Stack({ children }: { readonly children?: React.ReactNode }) {
    return <View testID="stack">{children}</View>;
  }
  Stack.displayName = 'Stack';
  Stack.Screen = MockStackScreen;
  return { Stack };
});

describe('Expo Router stack layouts', () => {
  const cases: [string, React.ComponentType][] = [
    ['(auth)', AuthLayout],
    ['(onboarding)', OnboardingLayout],
    ['(tabs)/search', SearchLayout],
    ['(tabs)/messages', MessagesLayout],
    ['(tabs)/bikes', BikesTabLayout],
    ['(tabs)/inventory', InventoryLayout],
    ['(tabs)/profile', ProfileLayout],
  ];

  it.each(cases)('%s renders a Stack', (_name, Layout) => {
    const { getByTestId } = render(<Layout />);
    expect(getByTestId('stack')).toBeTruthy();
  });
});
