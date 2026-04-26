import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import TabLayout from '../_layout';

type ScreenProps = {
  name: string;
  options: {
    tabBarBadgeStyle?: { backgroundColor?: string; color?: string };
    tabBarIcon?: (props: { color: string; size: number }) => React.ReactNode;
  };
};

const capturedScreens: ScreenProps[] = [];

jest.mock('expo-router', () => {
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

  it('renders an icon for every tab', () => {
    render(
      <PaperProvider theme={lightTheme}>
        <TabLayout />
      </PaperProvider>,
    );

    const expectedTabs = ['inventory', 'bikes', 'search', 'groups', 'messages', 'profile'];
    for (const name of expectedTabs) {
      const screen = capturedScreens.find((s) => s.name === name);
      const icon = screen?.options.tabBarIcon?.({ color: '#000', size: 24 });
      expect(icon).toBeTruthy();
    }
  });
});
