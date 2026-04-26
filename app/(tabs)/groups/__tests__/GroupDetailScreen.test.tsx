import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import type { Group, GroupId, UserId } from '@/shared/types';
import { GroupRole } from '@/shared/types';
import type { GroupMemberWithProfile } from '@/features/groups';
import groupsEn from '@/i18n/en/groups.json';

jest.mock('@/shared/components', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, Pressable } = require('react-native');
  return {
    ConfirmDialog: (props: {
      visible: boolean;
      title: string;
      onDismiss: () => void;
      onConfirm: () => void;
      testID?: string;
    }) => {
      const { visible, title, onDismiss, onConfirm, testID = 'confirm-dialog' } = props;
      if (!visible) {
        return null;
      }
      return (
        <View testID={testID}>
          <Text>{title}</Text>
          <Pressable testID={`${testID}-confirm`} onPress={onConfirm} />
          <Pressable testID={`${testID}-cancel`} onPress={onDismiss} />
        </View>
      );
    },
  };
});

const mockSearchParams: { id: string } = { id: 'group-abc' };

const mockTabScopedBack = jest.fn();
jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: (...args: unknown[]) => mockTabScopedBack(...args),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams,
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/features/groups/components/GroupInventoryTab', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { GroupInventoryTab: () => <View testID="group-inventory-tab" /> };
});

const mockUseGroup = jest.fn();
const mockUseGroupMembers = jest.fn();
const mockDeleteMutateAsync = jest.fn().mockResolvedValue(undefined);
const mockLeaveMutateAsync = jest.fn().mockResolvedValue(undefined);
const mockPromoteMutateAsync = jest.fn().mockResolvedValue(undefined);
const mockRemoveMutateAsync = jest.fn().mockResolvedValue(undefined);
const mockCancelInvitationMutateAsync = jest.fn().mockResolvedValue(undefined);
const mockUsePendingGroupInvitations = jest.fn();

jest.mock('@/features/groups', () => {
  // Avoid jest.requireActual('@/features/groups'): it pulls hooks that import Supabase.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, Pressable } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const permissions = require('@/features/groups/utils/groupPermissions');
  return {
    canInvite: permissions.canInvite,
    canRemoveMember: permissions.canRemoveMember,
    canEditGroup: permissions.canEditGroup,
    canDeleteGroup: permissions.canDeleteGroup,
    canPromoteMember: permissions.canPromoteMember,
    canLeaveGroup: permissions.canLeaveGroup,
    getAdminActions: permissions.getAdminActions,
    useGroup: () => mockUseGroup(),
    useGroupMembers: () => mockUseGroupMembers(),
    useUpdateGroup: () => ({ mutateAsync: jest.fn(), isPending: false }),
    useDeleteGroup: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
    useLeaveGroup: () => ({ mutateAsync: mockLeaveMutateAsync, isPending: false }),
    usePromoteMember: () => ({ mutateAsync: mockPromoteMutateAsync, isPending: false }),
    useRemoveMember: () => ({ mutateAsync: mockRemoveMutateAsync, isPending: false }),
    usePendingGroupInvitations: () => mockUsePendingGroupInvitations(),
    useCancelInvitation: () => ({ mutateAsync: mockCancelInvitationMutateAsync, isPending: false }),
    GroupEditForm: () => null,
    GroupInviteView: (props: {
      onBack: () => void;
      onInvited: () => void;
      onError: () => void;
    }) => (
      <View testID="group-invite-view">
        <Pressable testID="invite-view-back" onPress={props.onBack}>
          <Text>back</Text>
        </Pressable>
        <Pressable testID="invite-view-invited" onPress={props.onInvited}>
          <Text>invited</Text>
        </Pressable>
        <Pressable testID="invite-view-error" onPress={props.onError}>
          <Text>error</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    isAuthenticated: true,
    session: null,
    signOut: jest.fn(),
    isLoading: false,
  }),
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

import GroupDetailScreen from '../[id]';

const baseGroup: Group = {
  id: 'group-abc' as GroupId,
  name: 'Club',
  description: 'About',
  isPublic: true,
  ratingAvg: 0,
  ratingCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function buildMember(
  overrides: Partial<GroupMemberWithProfile> & { userId: UserId; role: GroupRole },
): GroupMemberWithProfile {
  return {
    groupId: 'group-abc' as GroupId,
    joinedAt: '2024-01-02T00:00:00.000Z',
    profile: { displayName: 'Member', avatarUrl: undefined },
    ...overrides,
  };
}

describe('GroupDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.id = 'group-abc';
    mockUseGroup.mockReturnValue({ data: baseGroup, isLoading: false });
    mockUsePendingGroupInvitations.mockReturnValue({ data: [] });
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    mockLeaveMutateAsync.mockResolvedValue(undefined);
    mockPromoteMutateAsync.mockResolvedValue(undefined);
    mockRemoveMutateAsync.mockResolvedValue(undefined);
    mockCancelInvitationMutateAsync.mockResolvedValue(undefined);
  });

  it('calls tabScopedBack when the app bar back action is pressed', () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Admin })],
      isLoading: false,
    });
    const { getByRole } = renderWithProviders(<GroupDetailScreen />);
    fireEvent.press(getByRole('button', { name: 'Back' }));
    expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/groups');
  });

  it('calls tabScopedBack after deleting the group', async () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Admin })],
      isLoading: false,
    });
    const { getByText, getByTestId } = renderWithProviders(<GroupDetailScreen />);
    fireEvent.press(getByText(groupsEn.detail.deleteGroup));
    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('group-abc');
      expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/groups');
    });
  });

  it('calls tabScopedBack after leaving the group', async () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Member })],
      isLoading: false,
    });
    const { getByText, getByTestId } = renderWithProviders(<GroupDetailScreen />);
    fireEvent.press(getByText(groupsEn.detail.leaveGroup));
    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    await waitFor(() => {
      expect(mockLeaveMutateAsync).toHaveBeenCalledWith('group-abc');
      expect(mockTabScopedBack).toHaveBeenCalledWith('/(tabs)/groups');
    });
  });

  it('opens the invite view when an admin presses the invite button', () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Admin })],
      isLoading: false,
    });
    const { getAllByText, getByTestId } = renderWithProviders(<GroupDetailScreen />);
    fireEvent.press(getAllByText(groupsEn.invite.inviteMember)[0]);
    expect(getByTestId('group-invite-view')).toBeTruthy();
  });

  it('returns from the invite view when back is pressed', () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Admin })],
      isLoading: false,
    });
    const { getAllByText, queryByTestId, getByTestId } = renderWithProviders(<GroupDetailScreen />);
    fireEvent.press(getAllByText(groupsEn.invite.inviteMember)[0]);
    fireEvent.press(getByTestId('invite-view-back'));
    expect(queryByTestId('group-invite-view')).toBeNull();
  });

  it('closes the invite view and no-ops onInvited/onError safely', () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Admin })],
      isLoading: false,
    });
    const { getAllByText, getByTestId, queryByTestId } = renderWithProviders(<GroupDetailScreen />);
    fireEvent.press(getAllByText(groupsEn.invite.inviteMember)[0]);
    fireEvent.press(getByTestId('invite-view-error'));
    expect(getByTestId('group-invite-view')).toBeTruthy();
    fireEvent.press(getByTestId('invite-view-invited'));
    expect(queryByTestId('group-invite-view')).toBeNull();
  });

  it('renders the pending invitations section for admins', () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Admin })],
      isLoading: false,
    });
    mockUsePendingGroupInvitations.mockReturnValue({
      data: [
        {
          id: 'inv-1',
          groupId: 'group-abc',
          inviteeUserId: 'user-2',
          inviterUserId: 'user-1',
          status: 'pending',
          createdAt: '2024-01-03T00:00:00.000Z',
          respondedAt: undefined,
          invitee: { displayName: 'Bob', avatarUrl: undefined },
        },
      ],
    });
    const { getByText } = renderWithProviders(<GroupDetailScreen />);
    expect(getByText(groupsEn.invite.pendingTitle)).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText(groupsEn.invite.pendingBadge)).toBeTruthy();
  });

  it('falls back to unknownMember label for pending invitees without a name', () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Admin })],
      isLoading: false,
    });
    mockUsePendingGroupInvitations.mockReturnValue({
      data: [
        {
          id: 'inv-1',
          groupId: 'group-abc',
          inviteeUserId: 'user-2',
          inviterUserId: 'user-1',
          status: 'pending',
          createdAt: '2024-01-03T00:00:00.000Z',
          respondedAt: undefined,
          invitee: { displayName: undefined, avatarUrl: undefined },
        },
      ],
    });
    const { getByText } = renderWithProviders(<GroupDetailScreen />);
    expect(getByText(groupsEn.detail.unknownMember)).toBeTruthy();
  });

  it('hides invite UI and pending invitations for non-admins', () => {
    mockUseGroupMembers.mockReturnValue({
      data: [buildMember({ userId: 'user-1' as UserId, role: GroupRole.Member })],
      isLoading: false,
    });
    mockUsePendingGroupInvitations.mockReturnValue({
      data: [
        {
          id: 'inv-1',
          groupId: 'group-abc',
          inviteeUserId: 'user-2',
          inviterUserId: 'user-1',
          status: 'pending',
          createdAt: '2024-01-03T00:00:00.000Z',
          respondedAt: undefined,
          invitee: { displayName: 'Bob', avatarUrl: undefined },
        },
      ],
    });
    const { queryByLabelText, queryByText } = renderWithProviders(<GroupDetailScreen />);
    expect(queryByLabelText(groupsEn.invite.inviteMember)).toBeNull();
    expect(queryByText(groupsEn.invite.pendingTitle)).toBeNull();
  });
});
