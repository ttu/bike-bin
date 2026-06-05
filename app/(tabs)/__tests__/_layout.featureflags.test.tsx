import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import TabLayout from '../_layout';

type ScreenProps = {
  name: string;
  redirect?: boolean;
  options: Record<string, unknown>;
};

const capturedScreens: ScreenProps[] = [];

let mockMarketplace = true;
let mockGroups = true;

jest.mock('@/shared/utils/featureFlags', () => ({
  get isMarketplaceEnabled() {
    return mockMarketplace;
  },
  get isGroupsEnabled() {
    return mockGroups;
  },
}));

jest.mock('expo-router', () => ({
  Tabs: Object.assign(({ children }: { children?: React.ReactNode }) => <>{children}</>, {
    Screen: (props: ScreenProps) => {
      capturedScreens.push(props);
      return null;
    },
  }),
}));

jest.mock('@/features/messaging', () => ({
  useUnreadCount: () => ({ data: 0 }),
}));

const ALL_TABS = ['inventory', 'bikes', 'search', 'groups', 'messages', 'profile'];

/** Tabs expo-router keeps in the navigator (a truthy `redirect` removes the route). */
function visibleTabs(): string[] {
  return capturedScreens.filter((s) => !s.redirect).map((s) => s.name);
}

function renderWithFlags(flags: { marketplace: boolean; groups: boolean }): void {
  mockMarketplace = flags.marketplace;
  mockGroups = flags.groups;
  capturedScreens.length = 0;
  render(
    <PaperProvider theme={lightTheme}>
      <TabLayout />
    </PaperProvider>,
  );
}

describe('(tabs)/_layout feature flags', () => {
  afterEach(() => {
    mockMarketplace = true;
    mockGroups = true;
  });

  it('shows every tab when both flags are on', () => {
    renderWithFlags({ marketplace: true, groups: true });
    expect(visibleTabs()).toEqual(ALL_TABS);
  });

  it('drops search + messages when the marketplace flag is off', () => {
    renderWithFlags({ marketplace: false, groups: true });
    expect(visibleTabs()).toEqual(['inventory', 'bikes', 'groups', 'profile']);
    expect(capturedScreens.find((s) => s.name === 'search')?.redirect).toBe(true);
    expect(capturedScreens.find((s) => s.name === 'messages')?.redirect).toBe(true);
  });

  it('drops groups when the groups flag is off', () => {
    renderWithFlags({ marketplace: true, groups: false });
    expect(visibleTabs()).toEqual(['inventory', 'bikes', 'search', 'messages', 'profile']);
    expect(capturedScreens.find((s) => s.name === 'groups')?.redirect).toBe(true);
  });

  it('leaves only the non-marketplace tabs when both flags are off', () => {
    renderWithFlags({ marketplace: false, groups: false });
    expect(visibleTabs()).toEqual(['inventory', 'bikes', 'profile']);
  });
});
