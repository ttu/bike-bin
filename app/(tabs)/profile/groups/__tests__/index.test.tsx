import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import type { GroupId } from '@/shared/types';
import { GroupRole } from '@/shared/types';
import type { GroupWithRole } from '@/features/groups';
import GroupsScreen from '../index';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

const mockUseGroups = jest.fn();
const mockUseSearchGroups = jest.fn();

jest.mock('@/features/groups', () => ({
  useGroups: () => mockUseGroups(),
  useSearchGroups: (query: string) => mockUseSearchGroups(query),
  useCreateGroup: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useJoinGroup: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

describe('GroupsScreen', () => {
  const sampleGroup: GroupWithRole = {
    id: 'group-abc' as GroupId,
    name: 'Test Group',
    description: undefined,
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    memberRole: GroupRole.Member,
    joinedAt: '2024-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGroups.mockReturnValue({ data: [sampleGroup], isLoading: false, refetch: jest.fn() });
    mockUseSearchGroups.mockReturnValue({ data: [], isLoading: false });
  });

  it('calls tabScopedBack when list back is pressed', () => {
    const { getByLabelText } = renderWithProviders(<GroupsScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(jest.mocked(tabScopedBack)).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('navigates to group detail when a group row is pressed', () => {
    const { getByText } = renderWithProviders(<GroupsScreen />);
    fireEvent.press(getByText('Test Group'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/profile/groups/group-abc');
  });
});
