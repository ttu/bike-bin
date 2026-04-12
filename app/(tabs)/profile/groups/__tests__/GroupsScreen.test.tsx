import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import type { GroupId } from '@/shared/types';
import { GroupRole } from '@/shared/types';
import type { GroupWithRole, SearchGroupResult } from '@/features/groups';
import commonEn from '@/i18n/en/common.json';
import groupsEn from '@/i18n/en/groups.json';
import GroupsScreen from '../index';

const mockShowSnackbarAlert = jest.fn();
jest.mock('@/shared/components/SnackbarAlerts', () => {
  const actual = jest.requireActual<typeof import('@/shared/components/SnackbarAlerts')>(
    '@/shared/components/SnackbarAlerts',
  );
  return {
    ...actual,
    useSnackbarAlerts: () => ({ showSnackbarAlert: mockShowSnackbarAlert }),
  };
});

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
const mockCreateMutateAsync = jest.fn().mockResolvedValue(undefined);
const mockJoinMutateAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('@/features/groups', () => ({
  useGroups: () => mockUseGroups(),
  useSearchGroups: (query: string) => mockUseSearchGroups(query),
  useCreateGroup: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
  useJoinGroup: () => ({ mutateAsync: mockJoinMutateAsync, isPending: false }),
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
    mockUseGroups.mockReturnValue({
      data: [sampleGroup],
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
    mockUseSearchGroups.mockReturnValue({ data: [], isLoading: false });
    mockCreateMutateAsync.mockResolvedValue(undefined);
    mockJoinMutateAsync.mockResolvedValue(undefined);
  });

  it('shows loading when groups list is empty and loading', () => {
    mockUseGroups.mockReturnValue({
      data: [],
      isLoading: true,
      isRefetching: false,
      refetch: jest.fn(),
    });
    renderWithProviders(<GroupsScreen />);
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
  });

  it('shows loading when search results are loading', () => {
    mockUseSearchGroups.mockImplementation(() => ({
      data: [],
      isLoading: true,
    }));
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByTestId('groups-search-button'));
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.search.placeholder), 'ab');
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
  });

  it('sets RefreshControl refreshing from isRefetching when list has groups', () => {
    const refetch = jest.fn();
    mockUseGroups.mockReturnValue({
      data: [sampleGroup],
      isLoading: false,
      isRefetching: true,
      refetch,
    });
    renderWithProviders(<GroupsScreen />);
    const list = screen.getByTestId('groups-screen-list');
    const refreshControl = list.props.refreshControl as {
      props: { refreshing?: boolean };
    };
    expect(refreshControl.props.refreshing).toBe(true);
  });

  it('calls tabScopedBack when list back is pressed', () => {
    const { getByTestId } = renderWithProviders(<GroupsScreen />);
    fireEvent.press(getByTestId('groups-screen-back'));
    expect(jest.mocked(tabScopedBack)).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('navigates to group detail when a group row is pressed', () => {
    const { getByText } = renderWithProviders(<GroupsScreen />);
    fireEvent.press(getByText('Test Group'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/profile/groups/group-abc');
  });

  it('completes create group flow on success', async () => {
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByLabelText(groupsEn.empty.cta));
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.create.namePlaceholder), 'New Crew');
    fireEvent.press(screen.getByTestId('groups-create-save'));
    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        name: 'New Crew',
        description: undefined,
        isPublic: false,
      });
      expect(mockShowSnackbarAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: commonEn.feedback.groupCreated, variant: 'success' }),
      );
    });
  });

  it('completes join group from search on success', async () => {
    const searchHit: SearchGroupResult = {
      id: 'join-me' as GroupId,
      name: 'Join Me',
      description: undefined,
      isPublic: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      memberCount: 2,
      isMember: false,
    };
    mockUseSearchGroups.mockImplementation((q: string) => ({
      data: q.length >= 2 ? [searchHit] : [],
      isLoading: false,
    }));
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByTestId('groups-search-button'));
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.search.placeholder), 'jo');
    fireEvent.press(screen.getByText(groupsEn.detail.joinGroup));
    await waitFor(() => {
      expect(mockJoinMutateAsync).toHaveBeenCalledWith('join-me');
      expect(mockShowSnackbarAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: commonEn.feedback.groupJoined, variant: 'success' }),
      );
    });
  });
});
