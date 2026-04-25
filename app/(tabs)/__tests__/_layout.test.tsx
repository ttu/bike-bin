import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import TabLayout from '../_layout';

type ScreenProps = {
  name: string;
  options: {
    tabBarBadgeStyle?: { backgroundColor?: string; color?: string };
  };
};

const capturedScreens: ScreenProps[] = [];

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Tabs: Object.assign(({ children }: { children?: React.ReactNode }) => <>{children}</>, {
      Screen: (props: ScreenProps) => {
        capturedScreens.push(props);
        return null;
      },
    }),
  };
});

jest.mock('@/features/messaging', () => ({
  useUnreadCount: () => ({ data: 3 }),
}));

describe('(tabs)/_layout', () => {
  beforeEach(() => {
    capturedScreens.length = 0;
  });

  it('paints the messages unread badge with the accent color', () => {
    render(
      <PaperProvider theme={lightTheme}>
        <TabLayout />
      </PaperProvider>,
    );

    const messages = capturedScreens.find((s) => s.name === 'messages');
    expect(messages?.options.tabBarBadgeStyle?.backgroundColor).toBe(
      lightTheme.customColors.accent,
    );
    expect(messages?.options.tabBarBadgeStyle?.color).toBe(lightTheme.customColors.onAccent);
  });
});
