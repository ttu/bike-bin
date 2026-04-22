import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import type { SearchGroupResult } from '@/features/groups/types';
import type { GroupId } from '@/shared/types';
import groupsEn from '@/i18n/en/groups.json';
import GroupsScreen from '../../../../app/(tabs)/groups/index';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
  },
}));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

const mockRefetch = jest.fn();

const mockCreateMutateAsync = jest.fn(() => Promise.resolve());
const mockJoinMutateAsync = jest.fn(() => Promise.resolve());

const mockSearchGroup: SearchGroupResult = {
  id: 'grp-search-1' as GroupId,
  name: 'Search Club',
  description: 'A group',
  isPublic: true,
  createdAt: new Date().toISOString(),
  memberCount: 3,
  isMember: false,
  ratingAvg: 0,
  ratingCount: 0,
};

let mockSearchResults: SearchGroupResult[] = [];

jest.mock('@/features/groups', () => ({
  /* eslint-disable @typescript-eslint/no-require-imports */
  GroupCreateForm: require('@/features/groups/components/GroupCreateForm/GroupCreateForm')
    .GroupCreateForm,
  GroupSearchView: require('@/features/groups/components/GroupSearchView/GroupSearchView')
    .GroupSearchView,
  /* eslint-enable @typescript-eslint/no-require-imports */
  useGroups: () => ({ data: [], isLoading: false, refetch: mockRefetch }),
  useSearchGroups: () => ({ data: mockSearchResults, isLoading: false }),
  useCreateGroup: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
  useJoinGroup: () => ({ mutateAsync: mockJoinMutateAsync, isPending: false }),
  useMyGroupInvitations: () => ({ data: [] }),
  useAcceptInvitation: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRejectInvitation: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

describe('GroupsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchResults = [];
    mockCreateMutateAsync.mockImplementation(() => Promise.resolve());
    mockJoinMutateAsync.mockImplementation(() => Promise.resolve());
  });

  it('shows empty state on the groups tab root', () => {
    renderWithProviders(<GroupsScreen />);
    expect(screen.getByText(groupsEn.empty.title)).toBeTruthy();
    expect(screen.getByText(groupsEn.title)).toBeTruthy();
  });

  it('opens create mode and returns to list', () => {
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByText(groupsEn.empty.cta));
    expect(screen.getByText(groupsEn.create.nameLabel)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.getByText(groupsEn.title)).toBeTruthy();
  });

  it('opens search mode', () => {
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByTestId('groups-search-button'));
    expect(screen.getByPlaceholderText(groupsEn.search.placeholder)).toBeTruthy();
  });

  it('shows validation when create is submitted without a name', () => {
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByText(groupsEn.empty.cta));
    const saveButtons = screen.getAllByText(groupsEn.create.save);
    fireEvent.press(saveButtons[saveButtons.length - 1]);
    expect(screen.getByText(groupsEn.validation.nameRequired)).toBeTruthy();
  });

  it('shows create failed when the mutation rejects', async () => {
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('create failed'));
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByText(groupsEn.empty.cta));
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.create.namePlaceholder), 'My Group');
    const saveButtons = screen.getAllByText(groupsEn.create.save);
    fireEvent.press(saveButtons[saveButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(groupsEn.errors.createFailed)).toBeTruthy();
    });
  });

  it('shows join failed when joining a search result fails', async () => {
    mockSearchResults = [mockSearchGroup];
    mockJoinMutateAsync.mockRejectedValueOnce(new Error('join failed'));
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByTestId('groups-search-button'));
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.search.placeholder), 'ab');
    fireEvent.press(screen.getByText(groupsEn.detail.joinGroup));
    await waitFor(() => {
      expect(screen.getByText(groupsEn.errors.joinFailed)).toBeTruthy();
    });
  });
});
