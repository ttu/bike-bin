import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import type { GroupId, UserId } from '@/shared/types';
import groupsEn from '@/i18n/en/groups.json';
import type { InvitableUser } from '../../../hooks/useGroupInvitations';
import { GroupInviteView } from '../GroupInviteView';

const mockUseSearchInvitableUsers = jest.fn();
const mockCreateMutateAsync = jest.fn();

jest.mock('../../../hooks/useGroupInvitations', () => ({
  useSearchInvitableUsers: (groupId: string, query: string) =>
    mockUseSearchInvitableUsers(groupId, query),
  useCreateInvitation: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
}));

const defaultProps = {
  groupId: 'group-1' as GroupId,
  onBack: jest.fn(),
  onInvited: jest.fn(),
  onError: jest.fn(),
};

const alice: InvitableUser = {
  id: 'user-alice' as UserId,
  displayName: 'Alice',
  avatarUrl: undefined,
};

describe('GroupInviteView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchInvitableUsers.mockReturnValue({ data: undefined, isLoading: false });
    mockCreateMutateAsync.mockResolvedValue(undefined);
  });

  it('shows the empty-query prompt when the search field is blank', () => {
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    expect(screen.getByText(groupsEn.invite.promptTitle)).toBeTruthy();
    expect(screen.getByText(groupsEn.invite.promptDescription)).toBeTruthy();
  });

  it('calls onBack when the back action is pressed', () => {
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('shows the loading indicator while results are loading', () => {
    mockUseSearchInvitableUsers.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.invite.searchPlaceholder), 'al');
    expect(screen.queryByText(groupsEn.invite.promptTitle)).toBeNull();
  });

  it('shows the no-results empty state when the query returns nothing', () => {
    mockUseSearchInvitableUsers.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.invite.searchPlaceholder), 'zz');
    expect(screen.getByText(groupsEn.invite.noResults)).toBeTruthy();
    expect(screen.getByText(groupsEn.invite.noResultsDescription)).toBeTruthy();
  });

  it('shows the unknown-member fallback when a result has no display name', () => {
    mockUseSearchInvitableUsers.mockReturnValue({
      data: [{ ...alice, displayName: undefined }],
      isLoading: false,
    });
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.invite.searchPlaceholder), 'a');
    expect(screen.getByText(groupsEn.detail.unknownMember)).toBeTruthy();
  });

  it('invites a user and calls onInvited on success', async () => {
    mockUseSearchInvitableUsers.mockReturnValue({ data: [alice], isLoading: false });
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.invite.searchPlaceholder), 'al');
    fireEvent.press(screen.getByText(groupsEn.invite.sendInvitation));
    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        groupId: 'group-1',
        userId: 'user-alice',
      });
      expect(defaultProps.onInvited).toHaveBeenCalled();
    });
    expect(defaultProps.onError).not.toHaveBeenCalled();
  });

  it('calls onError when creating an invitation fails', async () => {
    mockUseSearchInvitableUsers.mockReturnValue({ data: [alice], isLoading: false });
    mockCreateMutateAsync.mockRejectedValue(new Error('boom'));
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.invite.searchPlaceholder), 'al');
    fireEvent.press(screen.getByText(groupsEn.invite.sendInvitation));
    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalled();
    });
    expect(defaultProps.onInvited).not.toHaveBeenCalled();
  });

  it('treats whitespace-only queries as empty', () => {
    renderWithProviders(<GroupInviteView {...defaultProps} />);
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.invite.searchPlaceholder), '   ');
    expect(screen.getByText(groupsEn.invite.promptTitle)).toBeTruthy();
  });
});
